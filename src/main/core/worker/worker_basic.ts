import { parentPort, workerData, isMainThread } from 'worker_threads';
import { addWorkerPort } from './worker_mgr';
import { WorkerContext } from './worker_ds';
import { WorkerIdentify } from './worker_define';

import { BasicPatch } from './worker_patch';

/* 线程工作标准抽象类 */
export abstract class WorkerBasicWrapper {
  /* 注册标准动作触发器 */
  private readonly basicPatch: BasicPatch;
  protected context!: WorkerContext;
  constructor() {
    equalValue(isMainThread, false, 'This class can only be instantiated in a worker thread.');
    equalValue(process.instance, undefined, 'This process instance has already been set');
    this.basicPatch = new BasicPatch();
    this.context = workerData;
    process.identity = this.context.env.name;
    process.instance = this;
    addWorkerPort(WorkerIdentify.MAIN_THREAD_IDENTIFY, parentPort!!);
  }
  public activate() {
    console.log(`worker ${process.identity} is activated`);
  }
}
