import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { HasReturn } from '@/main/core/worker/worker_desc';
import { getWorkerInstance } from '@/main/core/worker/worker_mgr';
import { Thread } from '@/main/core/worker/worker_desc';

@Thread()
export class TestBWroker extends WorkerBasicWrapper {
  constructor() {
    super();
    console.log('B 被创建了')
    setTimeout(async () => {
      const p = (await getWorkerInstance('worker-1')) as any;
      console.log(process.identity,await p.look());
    }, 1000);
  }
 
  sayHi(name: string) {
    console.log('hello, i am ', process.identity);
    return `hello, i'm kuku`;
  }
}
StartWorker(TestBWroker);
