import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { getWorkerInstance } from '@/main/core/worker/worker_mgr';
import { Thread } from '@/main/core/worker/worker_desc';

@Thread()
export class TestCWroker extends WorkerBasicWrapper {
  constructor() {
    super();
    setTimeout(async () => {
 
    }, 1000);
  }
}
// StartWorker(TestCWroker);
