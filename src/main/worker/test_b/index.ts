import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { HasReturn } from '@/main/core/worker/worker_desc';
import { getWorkerInstance } from '@/main/core/worker/worker_mgr';
export class TestBWroker extends WorkerBasicWrapper {
  constructor() {
    super();
    setTimeout(async () => {
      const p = (await getWorkerInstance('worker-1')) as any;
      console.log(process.identity,await p.look());
    }, 1000);
  }

  @HasReturn(true)
  sayHi(name: string) {
    console.log('hello, i am ', process.identity);
    return `hello, i'm kuku`;
  }
}
StartWorker(TestBWroker);
