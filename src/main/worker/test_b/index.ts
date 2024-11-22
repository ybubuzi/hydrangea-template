import { WorkerBasicWrapper } from '@/main/core/worker/worker_basic';
import { StartWorker } from '@/main/core/worker/worker_starter';
import { Thread, InjectWorker } from '@/main/core/worker/worker_desc';

@Thread()
export class TestBWroker extends WorkerBasicWrapper {
  
  // @InjectWorker('worker-1')
  // private aoo;

  // constructor() {
  //   super();
  //   this.lazyRun()
  // }

  // sayHi(name: string) {
  //   const msg = `hello, i'm ${process.identity}`;
  //   console.log(`[${process.identity}][sayHi]:`, `hello ${name},`);
  //   console.log(`[${process.identity}][sayHi]:`, `I will send you a message of [${msg}]`);
  //   return msg;
  // }
  // lazyRun() {
  //   setTimeout(async () => {
  //     const msg = await this.aoo.look();
  //     console.log(`[${process.identity}][lazyRun]:`, msg);
  //   },1000);
  // }
}
StartWorker(TestBWroker);
