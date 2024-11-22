import { WorkerIdentify } from './worker_define';
import { WorkerTransmit, RegisterPack, WorkerMetaInfo } from './worker_ds';
import { HasReturn, HasTransmit } from './worker_desc';
import { getPort, addWorkerPort, addWorkerMeta } from './worker_mgr';
import { getWorkerInfo, LOCAL_INJECT_QUEUE } from './worker_desc';

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

  /**
   * 接受来自其他线程的注册信息
   * @param transmit
   */
  @HasReturn(false)
  @HasTransmit()
  async addMeta(transmit: WorkerTransmit<WorkerMetaInfo>) {
    addWorkerMeta(transmit);
  }

  /**
   * 线程激活前回调
   * 在`executeActivate`函数执行前执行
   */
  @HasReturn(true)
  async beforeActivate() {
    console.log(`激活前`);
    return await new Promise<void>((resolve) => {
      setTimeout(async () => {
        for (const callback of LOCAL_INJECT_QUEUE) {
          await callback();
        }
        resolve();
      }, 3000);
    });
  }

  /**
   * 业务线程启动函数，激活周期
   */
  @HasReturn(false)
  async executeActivate() {
    notNil(process.instance);
    process.instance.activate();
  }
}
