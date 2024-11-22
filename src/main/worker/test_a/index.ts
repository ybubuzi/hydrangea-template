import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { HasReturn } from '@/main/core/worker/worker_desc';
import { Thread, InjectWorker } from '@/main/core/worker/worker_desc';

@Thread()
export class TestAWroker extends WorkerBasicWrapper {
  @InjectWorker('worker-2')
  private boo;

  constructor() {
    super();
  }

  @HasReturn(false)
  look() {
    console.log(`[${process.identity}][look]:`, `I've been called`);
  }

  public async activate() {
    const msg = await this.boo.sayHi(process.identity);
    console.log(`[${process.identity}][lazyRun]:`, `I received your message "${msg}"`);
  }
}

StartWorker(TestAWroker);
