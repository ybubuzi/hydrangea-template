/**
 * 定义线程之间的几把类型
 */
import { nanoid } from 'nanoid';
import dayjs from 'dayjs';
import { HydrangeaError } from '@/shared/common/hydrangea-error';
import {MessagePort} from 'worker_threads'
/**
 * 线程创建时携带的信息
 */
export interface WorkerContext<T = never> {
  env: {
    name: string;
    /** 程序执行根目录 */
    root_dir: string;
    /** 当前是否是开发环境 */
    is_dev: boolean;
  };
  /** 额外数据 */
  data?: T;
}

/**
 * 线程间传输对象
 */
export class WorkerTransmit<T = never> {
  /** 请求id，唯一 */
  public readonly id: string;
  /** 请求来源标识符 */
  public readonly srcIdentify: string;
  /** 请求目标标识符 */
  public readonly dstIdentify: string;
  /** 请求动作 */
  public readonly action: string = '';
  /** 数据负载 */
  public payload?: T;
  /** 请求开始时间 */
  public readonly createTime: number;
  /** 请求完成时间 */
  public completeTime: number = 0;
  /** 错误对象 */
  public lastError?: HydrangeaError;

  constructor(dstIdentify: string, action: string = '', payload?: T) {
    this.id = nanoid();
    this.srcIdentify = process.identity;
    this.dstIdentify = dstIdentify;
    this.createTime = dayjs().unix();
    this.action = action;
    this.payload = payload;
  }

  static toComplate<T = never, Req = never>(req: WorkerTransmit<Req>, data?: T): WorkerTransmit<T> {
    const respose = Object.assign({}, req, {
      payload: data,
      completeTime: dayjs().unix()
    });
    return respose;
  }

  static toError<T = never, Req = never>(req: WorkerTransmit<Req>, error: HydrangeaError): WorkerTransmit<T> {
    const respose = this.toComplate(req);
    respose.lastError = error;
    return respose;
  }
}

/**
 * 进程动作描述定义
 */
export class ActionMeta {
  /** 该动作标志 */
  label: string = '';
  /** 改动作有返回值 */
  has_return: boolean = true;
  /** 改动作需要原始数据 */
  has_transmit: boolean = false;
  /** 该动作的超时时间 */
  max_timeout: number = -1;
  /** 该动作的描述 */
  desc: string = '';
}

export interface WorkerMetaInfo {
  [key: string]: ActionMeta;
}

export interface RegisterPack {
  port:MessagePort,
  info: WorkerMetaInfo
}