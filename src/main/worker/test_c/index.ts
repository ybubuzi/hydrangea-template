import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { getWorkerInstance } from '@/main/core/worker/worker_mgr';
import { Thread } from '@/main/core/worker/worker_desc';

@Thread()
export class TestCWroker extends WorkerBasicWrapper {
  constructor() {
    super();
    setTimeout(async () => {
      const a = (await getWorkerInstance('worker-1')) as any;
      const b = (await getWorkerInstance('worker-2')) as any;
      console.log(process.identity, await a.look());
      console.log(process.identity, await b.sayHi());
    }, 1000);
  }
}
StartWorker(TestCWroker);
