import { WorkerIdentify, BasicAction } from './worker_define';
import { WorkerTransmit, ActionMeta, WorkerMetaInfo } from './worker_ds';
import { Worker, MessagePort, MessageChannel, TransferListItem, isMainThread } from 'worker_threads';
import { getWorkerInfo } from './worker_desc';

/* ============================ BEIGN 内部结构区 =================================== */
interface ActionFunction {
  (transmit: WorkerTransmit): ActionMeta & { result: Promise<any> };
}
/* ============================ END 内部结构区 =================================== */

/* ============================ BEIGN 内部变量区 =================================== */
/* 记录工作进程与信道的映射关系 */
const WorkerPortMapper = new Map<WorkerIdentify | string, MessagePort>();
/* 记录该线程内所有标识符与动作的映射关系 */
const WorkerActionMapper = new Map<string, ActionFunction>();
/** 记录本线程发出的同步请求 */
const WorkerReqquestMapper = new Map<string, PromisePair>();
/** 记录线程注册信息 */
const WorkerTargetMateMapper = new WeakMap<MessagePort, WorkerMetaInfo>();
/* =========================== END 内部变量区 =================================== */

/**
 * 获取指定进程的信道信息
 * @param identify
 * @returns
 */
export function getPort(identify: WorkerIdentify | string) {
  const port = WorkerPortMapper.get(identify);
  notNil(port, `${identify} process port is not set`);
  return port;
}

/**
 * 添加信道链接关系
 * @param identify
 * @param port
 */
export function addWorkerPort(identify: WorkerIdentify, port: MessagePort, info?: WorkerMetaInfo) {
  WorkerPortMapper.set(identify, port);
  if (info) {
    WorkerTargetMateMapper.set(port, info);
  }

  // 为新建立的信道增加事件派发
  port.addListener('message', async (transmit: unknown) => {
    equalType<WorkerTransmit>(transmit, 'object');
    // 判断transimit是否是已完成的事件，若是，则为本地发起对方返回的结果
    if (transmit.completeTime) {
      // 查询本地同步请求队列
      const requestPair = WorkerReqquestMapper.get(transmit.id);
      if (!requestPair) {
        throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Request not found');
      }
      // 将结果放入队列中
      requestPair.resolve(transmit.payload);
      return;
    }
    // 判断是否是主线程接收到不属于自己的请求 - 应当是错误请求
    if (!isMainThread && transmit.dstIdentify !== process.identity) {
      throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Passed to a non-target thread');
    }

    // 接收到信息后查询本地注册动作
    const action = WorkerActionMapper.get(transmit.action);
    if (!action) {
      // 非法动作调用
      throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, `Action ${transmit.action} not found`);
    }
    // 执行动作，并返回动作元信息
    const resultTemp = action(transmit);
    if (resultTemp.has_return) {
      // 等待目标动作完成
      const payload = await resultTemp.result;
      const resultTransmit = WorkerTransmit.toComplate(transmit, payload);
      // 使用原生方法返回调用方
      // 返回源调用方
      getPort(transmit.srcIdentify).postMessage(resultTransmit);
    }
  });
}

export async function request<T>(port: MessagePort, transmit: WorkerTransmit<T>, transferList?: readonly TransferListItem[]);
export async function request<T>(transmit: WorkerTransmit<T>, transferList?: readonly TransferListItem[]);
export async function request<T>(...args: any[]) {
  const fristIsPort = args[0] instanceof MessagePort || args[0] instanceof Worker;
  const transmit: WorkerTransmit<T> = fristIsPort ? args[1] : args[0];
  const transferList = fristIsPort ? args[2] : args[1];
  const port = fristIsPort ? args[0] : getPort(transmit.dstIdentify);
  // 避免自己向自己发送数据
  if (transmit.dstIdentify === process.identity) {
    throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, 'Cannot send message to self');
  }
  if (!port) {
    throw new HydrangeaError(ErrorCode.BROKEN_FUNCTION_PARAMS, `Port ${transmit.dstIdentify} not found`);
  }
  const info = WorkerTargetMateMapper.get(port);
  let mate: ActionMeta;
  if (!info || !(mate = info[transmit.action])) {
    throw new HydrangeaError(ErrorCode.BAD_CALL_FUNCTION, `Action ${transmit.action} not found`);
  }
  let promise = Promise.resolve(void 0);
  if (mate.has_return) {
    promise = new Promise((resolve, reject) => {
      WorkerReqquestMapper.set(transmit.id, { resolve, reject });
    });
  }
  // TODO: 获取函数描述符，判断是否建立等待数列
  port.postMessage(transmit, transferList);
  return promise;
}

/**
 * 添加一条动作映射
 * @param actionName
 * @param trigger
 */
export function addTiggerAction(actionName: string, trigger: ActionFunction) {
  WorkerActionMapper.set(actionName, trigger);
}

/**
 * 创建信道之间的链接
 * 返回本地信道
 * 建立信道链接需要通过主进程做通知
 * 若A线程想与B线程建立链接及如下
 * A--请求-->MAIN,
 * MAIN--转发-->B
 * B---响应---->A
 * 链接建立完成
 */
async function createWorkerLink(identify: WorkerIdentify): Promise<MessagePort> {
  const targetPort = WorkerPortMapper.get(identify);
  if (targetPort) {
    return targetPort;
  }
  // 获取主进程信道
  const mainPort = getPort(WorkerIdentify.MAIN_THREAD_IDENTIFY);
  const channel = new MessageChannel();

  const transmit = new WorkerTransmit(identify, BasicAction.REGISTER, {
    port: channel.port2,
    info: getWorkerInfo()
  });
  addWorkerPort(identify, channel.port1);
  // 使用默认传输
  mainPort.postMessage(transmit, [channel.port2]);
  // 这里获取线程暴露函数的注册信息
  const registerInfo = await new Promise<WorkerMetaInfo>((resolve, reject) => {
    WorkerReqquestMapper.set(transmit.id, { resolve, reject });
  });
  WorkerTargetMateMapper.set(channel.port1, registerInfo);

  return channel.port1;
}

/**
 * 获取进程调用实例，若不存在则创建
 * @param identify
 */
export async function getWorkerInstance(identify: WorkerIdentify | string) {
  const workerPort = await createWorkerLink(identify as WorkerIdentify);
  const proxy = new Proxy(
    {},
    {
      get(_target: object, prop: string, receiver) {
        if (['then', 'catch', 'finally'].includes(prop)) {
          return receiver;
        }
        const exist = _target[prop];
        if (exist) {
          return exist;
        }
        const fn = (...args: any[]) => {
          const transmit = new WorkerTransmit(identify, prop, args);
          return request(workerPort, transmit);
        };
        _target[prop] = fn;
        return _target[prop];
      }
    }
  ) as any;
  return proxy;
}
