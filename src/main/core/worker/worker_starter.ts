import { BasicPatch } from './worker_patch';
import {getWorkerInfo} from './worker_desc'
import { isMainThread } from 'worker_threads';

export function initWorker() {
  new BasicPatch()
}


export function StartWorker<T extends new () => any>(Target: T) {
  initWorker()
  const _instance = new Target();
  if (_instance) {
    console.log(`Thread ${Target.name} has started`);
  }
  const info = getWorkerInfo()
  if(!isMainThread){
    
  }
  // 发送注册信息给主进程，注册信息由主进程统一管理

}
