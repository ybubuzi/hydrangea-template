import { WorkerIdentify } from './worker_define';
import { WorkerTransmit, RegisterPack } from './worker_ds';
import { HasReturn, HasTransmit } from './worker_desc';
import { getPort, addWorkerPort } from './worker_mgr';
import { getWorkerInfo } from './worker_desc';

/**
 * 默认动作触发器
 */
export class BasicPatch {
  @HasReturn(false)
  @HasTransmit()
  async register(transmit: WorkerTransmit<RegisterPack>) {
    // 注册请求时，主进程仅做转发操作
    if (process.identity === WorkerIdentify.MAIN_THREAD_IDENTIFY) {
      notNil(transmit.payload);
      getPort(transmit.dstIdentify).postMessage(transmit, [transmit.payload.port]);
      return;
    }
    // 判断是否是其他线程注册至本地
    if (transmit.dstIdentify === process.identity) {
      notNil(transmit.payload);
      const result = WorkerTransmit.toComplate(transmit, getWorkerInfo());

      addWorkerPort(transmit.srcIdentify as any, transmit.payload.port);
      transmit.payload.port.postMessage(result);
    }
  }
}
