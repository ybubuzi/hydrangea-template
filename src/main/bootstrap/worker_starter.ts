import assert from 'node:assert';
import { getExePath } from '@/main/utils/application';
import { is } from '@electron-toolkit/utils';
import { Worker, MessageChannel, MessagePort } from 'worker_threads';
import { WorkerContext, WorkerTransmit } from '@/main/core/worker/worker_ds';
import { addWorkerPort } from '@/main/core/worker/worker_mgr';
import { BasicPatch } from '@/main/core/worker/worker_patch';

interface ModuleLike {
  default: string;
}
class WorkerLike {
  constructor(
    public name: string,
    public worker: Worker
  ) {}
}
/**
 * 断言对象是一个Worker脚本
 * @param module
 */
function assertModule(module: any): asserts module is ModuleLike {
  assert.equal(typeof module?.default, 'string', `Not A Worker Module`);
}

/**
 * 为工作进程添加默认监视器
 * @param worker
 * @param name
 */
function addGlobalListener(name: string, worker: Worker) {
  worker.addListener('error', (error) => {
    console.log(`trhead ${name} occur error`);
    console.error(error);
  });
  worker.addListener('exit', () => {
    console.log(`trhead ${name} exit`);
  });
}

/**
 * 获取目标工作进程并启动
 * 注册主进程与进程之间的信道
 */
export default function () {
  const patch = new BasicPatch()
  const modules = import.meta.glob('@/main/worker/**/index.ts', {
    eager: true,
    query: '?modulePath'
  });
  const paths = Object.keys(modules);
  const workerList: Array<WorkerLike> = [];
  let id = 1;
  for (const path of paths) {
    const module = modules[path] as any;
    assertModule(module);
    const name = 'worker-' + String(id++);
    const context: WorkerContext = {
      env: {
        name,
        root_dir: getExePath(),
        is_dev: is.dev
      }
    };
    const worker = new Worker(module.default, {
      workerData: context
    });
    workerList.push(new WorkerLike(name, worker));
    addWorkerPort(name as any, worker as unknown as MessagePort);
  }
  for (const like of workerList) {
    addGlobalListener(like.name, like.worker);
  }
}
