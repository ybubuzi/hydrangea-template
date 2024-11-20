export {};

declare global {
  /** 进程标识符 */
  type WorkerIdentify = string;

  namespace NodeJS {
    interface Process {
      /** 进程名称 */
      identity: WorkerIdentify;
      /** 进程实例 */
      instance: InstanceType<typeof import('@/main/core/worker/worker_basic').WorkerBasicWrapper>;
    }
  }
}
