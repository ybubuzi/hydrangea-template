/**
 * 用于提供标记线程信息相关的工具库
 */
import { WorkerTransmit, ActionMeta } from './worker_ds';
import { addTiggerAction, getWorkerInstance, getPort } from './worker_mgr';
import { isMainThread } from 'worker_threads';
import { WorkerIdentify, BasicAction } from './worker_define';

type ClassConstructor<T = any> = new (...args: any[]) => T;

/**
 * 函数装饰器参数结构体
 */
class FunctionDecoratorParam {
  target: Object = {};
  prop: string = '';
  func = { value: (...args: any[]) => null };
}

/**
 * 函数描述信息结构
 */
class MetaNode {
  mate = new ActionMeta();
  decorator = new FunctionDecoratorParam();
}
/**
 * 依赖注入描述
 */
class DepMeta {
  memberName: string = '';
  dependName: string = '';
}
/**
 * 记录对象所有的注册函数,最终注册完成将返回给调用方
 * Key为实例对象
 */
const API_META_MAPPER = new Map<Object, Map<string, MetaNode>>();

/** 记录本地业务类缓存,key为业务类构造函数,value对应业务实例 */
const WORKER_INSTANCE_MAPPER = new Map<ClassConstructor, Object>();

/* 记录本地线程依赖注入的信息 */
const LOCAL_DEPENDENCY_INJECT = new Map<ClassConstructor, Array<DepMeta>>();

/** 记录本地所有需要依赖注入的类注册方法，将在线程激活前调用 */
export const LOCAL_INJECT_QUEUE = new Array<Function>()

/**
 * 新增或更新暴露函数的信息
 * 建立函数被调用链接
 * 同时将动作添加至调用集合，当接受到其他进程发送的数据将尝试匹配
 * @param params
 * @param updateMeta
 */
function addOrUpdateAction(params: FunctionDecoratorParam, updateMeta: Partial<ActionMeta>) {
  const originConstructor = params.target.constructor as any;
  // 检测构造器实例是否已建立映射，若已建立，则使用已建立的实例
  const existing = WORKER_INSTANCE_MAPPER.get(originConstructor);
  const target = existing ?? params.target;
  if (!existing) {
    WORKER_INSTANCE_MAPPER.set(originConstructor, target);
  }
  params.target = target;
  let metaMap = API_META_MAPPER.get(params.target);
  if (!metaMap) {
    metaMap = new Map();
    API_META_MAPPER.set(params.target, metaMap);
  }
  let methodNode = metaMap.get(params.prop);
  if (!methodNode) {
    methodNode = new MetaNode();
    methodNode.decorator = params;
    metaMap.set(params.prop, methodNode);
    /** 这里的注册值可通过params.target进一步确认调用的类 */
    const eventName = params.prop;
    const node = methodNode;
    addTiggerAction(eventName, (transmit: WorkerTransmit) => {
      // 动作已完成
      if (transmit.completeTime) {
        // 当前是主进程，且目标线程不是自己时仅转发
        if (!isMainThread) {
          throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Action has been completed');
        }
      }
      // 非主线程接收到不属于自己的请求 - 应当是错误请求
      if (!isMainThread && transmit.dstIdentify !== process.identity) {
        throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Passed to a non-target thread');
      }
      const args = Array.isArray(transmit.payload) ? transmit.payload : [transmit.payload];
      // 通过注解决定是否将传输对象结构传入
      const dto = node.mate.has_transmit ? [transmit] : args;
      const result = Promise.resolve(node.decorator.func.value.call(node.decorator.target, ...dto));
      return {
        ...node.mate,
        result
      };
    });
  }

  Object.assign(methodNode.mate, updateMeta);
}

/**
 * 获取当前进程的描述信息
 * @returns
 */
export function getWorkerInfo() {
  const info = {};
  for (const [_workerInstance, metas] of API_META_MAPPER.entries()) {
    for (const [action, meta] of metas.entries()) {
      info[action] = meta.mate;
    }
  }
  return info;
}

/**
 * 标记一个函数是否有返回值
 * @param falg
 * @returns
 */
export function HasReturn(falg: boolean = true) {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { has_return: falg });
  };
}
/**
 * 标记一个函数是否需要默认传输对象
 * @returns
 */
export function HasTransmit() {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { has_transmit: true });
  };
}
/**
 * 标记一个函数的调用超时时间
 * @param timeout
 * @returns
 */
export function MaxTimeout(timeout: number = 1000) {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { max_timeout: timeout });
  };
}

/**
 * 标记一个函数详细信息
 * @param desc
 * @returns
 */
export function FunctionDesc(desc: string) {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { desc: desc });
  };
}

/**
 * 标记该类的所有函数将暴露
 */
export function Thread() {
  return function <T extends ClassConstructor>(Module: T) {
    const SubClass = class extends Module {
      constructor(...args: any[]) {
        super(...args); // 调用原始构造器
        // @ts-ignore
        const origin = Object.getPrototypeOf(this);
        // 更新构造器实例映射
        if (!WORKER_INSTANCE_MAPPER.get(Module)) {
          WORKER_INSTANCE_MAPPER.set(Module, this);
        }
        // todo: 可选择检测WORKER_INSTANCE_MAPPER是否存在映射来限制类创建单例
        Promise.resolve(this._register());
        LOCAL_INJECT_QUEUE.push(this._inject.bind(this))
      }
      /** 获取当前类实例所有函数并注册 */
      private _register() {
        // @ts-ignore
        const origin = Object.getPrototypeOf(this);
        // @ts-ignore
        const proto = origin.__proto__;
        let members = Object.getOwnPropertyNames(proto);
        members = members.filter((m) => m !== 'constructor' && typeof proto[m] === 'function');
        const target = WORKER_INSTANCE_MAPPER.get(Module) ?? this;
        for (const member of members) {
          addOrUpdateAction(
            {
              target: target,
              prop: member,
              func: {
                value: this[member]
              }
            },
            {}
          );
        }
        const info = getWorkerInfo();
        const transmit = new WorkerTransmit(WorkerIdentify.MAIN_THREAD_IDENTIFY, BasicAction.ADD_META, info);
        if (process.identity != WorkerIdentify.MAIN_THREAD_IDENTIFY) {
          getPort(WorkerIdentify.MAIN_THREAD_IDENTIFY).postMessage(transmit);
        }
      }

      private _inject() {
        setTimeout(async () => {
          const dependList = LOCAL_DEPENDENCY_INJECT.get(Module);
          if (!dependList) {
            return;
          }
          const instance = WORKER_INSTANCE_MAPPER.get(Module);
          if (!instance) {
            throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Instance not found');
          }
          for (const depend of dependList) {
            const worker = await getWorkerInstance(depend.dependName);
            Reflect.set(this, depend.memberName, worker);
          }
        }, 300);
      }
    };
    return SubClass as T;
  };
}
/**
 * 标记该方法将被暴露
 */
export function ThreadMethod() {}
/**
 * 标记该属性将才有注入方式导入其他线程的引用
 */
export function InjectWorker(name: string): PropertyDecorator {
  return function <T extends { constructor: ClassConstructor }>(Module: T, prop: any) {
    const TargetConstructor = Module.constructor;
    notNil(TargetConstructor, 'TargetConstructor is not found');
    let dependList = LOCAL_DEPENDENCY_INJECT.get(TargetConstructor);
    if (!dependList) {
      dependList = new Array();
      LOCAL_DEPENDENCY_INJECT.set(TargetConstructor, dependList);
    }
    dependList.push({
      dependName: name,
      memberName: prop
    });
  } as PropertyDecorator;
}
