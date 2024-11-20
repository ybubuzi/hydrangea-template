/**
 * 用于提供标记线程信息相关的工具库
 */
import { WorkerTransmit, ActionMeta } from './worker_ds';
import { addTiggerAction } from './worker_mgr';
import { isMainThread } from 'worker_threads';

class DecoratorParam {
  target: Object = {};
  prop: string = '';
  func = { value: (...args:any[]) => null };
}
class MetaNode {
  mate = new ActionMeta();
  decorator = new DecoratorParam();
}
/** 记录对象所有的注册函数,最终注册完成将返回给调用方 */
const API_META_MAPPER = new Map<Object, Map<string, MetaNode>>();

/**
 * 新增或更新暴露函数的信息
 * 建立函数被调用链接
 * @param params
 * @param updateMeta
 */
function addOrUpdateAction(params: DecoratorParam, updateMeta: Partial<ActionMeta>) {
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
        if(!isMainThread){
          throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Action has been completed');
        }
        
      }
      // 非主线程接收到不属于自己的请求 - 应当是错误请求
      if (!isMainThread && transmit.dstIdentify !== process.identity) {
        throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Passed to a non-target thread');
      }
      const args  = Array.isArray(transmit.payload) ? transmit.payload : [transmit.payload];
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

export function getWorkerInfo(){
  const info = {}
  for(const [_workerInstance,metas] of API_META_MAPPER.entries()){
    for(const [action,meta] of metas.entries()){
      info[action] = meta.mate
    }
  }
  return info
}

export function HasReturn(falg: boolean = true) {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { has_return: falg });
  };
}
export function HasTransmit() {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { has_transmit: true });
  };
}
export function MaxTimeout(timeout: number = 1000) {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { max_timeout: timeout });
  };
}
export function FunctionDesc(desc: string) {
  return function (target, prop, func) {
    addOrUpdateAction({ target, prop, func }, { desc: desc });
  };
}

/**
 * 标记该类的所有函数将暴露
 */
export function Thread() {}
/**
 * 标记该方法将被暴露
 */
export function ThreadMethod() {}
/**
 * 标记该属性将才有注入方式导入其他线程的引用
 */
export function InjectWorker() {}
