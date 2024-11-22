import assert from 'node:assert';
import { getExePath } from '@/main/utils/application';
import { is } from '@electron-toolkit/utils';
import { Worker, MessagePort } from 'worker_threads';
import { WorkerContext } from '@/main/core/worker/worker_ds';
import { addWorkerPort } from '@/main/core/worker/worker_mgr';
import { BasicPatch } from '@/main/core/worker/worker_patch';
import { isRegistered, getWorkerInstance, unRegister } from '@/main/core/worker/worker_mgr';
import { BasicAction } from '@/main/core/worker/worker_define';
interface ModuleLike {
  default: string;
}
class WorkerLike {
  constructor(
    public name: string,
    public worker: Worker
  ) {}
}

let workerList: Array<WorkerLike> = [];
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
function addGlobalListener(name: WorkerIdentify | string, worker: Worker) {
  worker.addListener('error', (error) => {
    console.log(`trhead ${name} occur error`);
    console.error(error);
  });
  worker.addListener('exit', () => {
    console.log(`trhead ${name} exit`);
    unRegister(name);
    workerList = workerList.filter((like) => like.name != name);
  });
}

async function deepWaitReady() {
  const hasNotReady = workerList.filter((like) => !isRegistered(like.name));
  if (!hasNotReady || hasNotReady.length === 0) {
    return Promise.resolve();
  }
  await new Promise<void>((resolve) => {
    setTimeout(resolve, 50);
  });
  return deepWaitReady();
}

/**
 * 获取目标工作进程并启动
 * 注册主进程与进程之间的信道
 */
export default async function () {
  // 启动基础监听
  new BasicPatch();

  const modules = import.meta.glob('@/main/worker/**/index.ts', {
    eager: true,
    query: '?modulePath'
  });
  const paths = Object.keys(modules);

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
  await deepWaitReady();
  for (const like of workerList) {
    const instance = await getWorkerInstance(like.name);
    await instance[BasicAction.BEFORE_ACTIVATE]();
    console.log(`线程${like.name}, 依赖注入完毕`);
    instance[BasicAction.EXECUTE_ACTIVATE]();
  }
}
