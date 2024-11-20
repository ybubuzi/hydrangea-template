import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { getWorkerInstance } from '@/main/core/worker/worker_mgr';
import { HasReturn } from '@/main/core/worker/worker_desc';
import { Thread } from '@/main/core/worker/worker_desc';

@Thread()
export class TestAWroker extends WorkerBasicWrapper {
  
  constructor() {
    super();
    setTimeout(async () => {
      const p = (await getWorkerInstance('worker-2')) as any;
      console.log(process.identity,await p.sayHi());
    }, 1000);
  }

  @HasReturn(false)
  look() {
    console.log('looked from b');
  }
}

StartWorker(TestAWroker);
