export type HydrangeaErrorCode = number;

export enum ErrorCode {
  /** 未知异常 */
  UNKNOWN = 0x00000,
  /** 类型非法 */
  TYPE_ILLEGALITY,
  /** 值非法 */
  VALUE_ILLEGALITY,
  /** 执行参数非法 */
  BROKEN_FUNCTION_PARAMS,
  /** 错误的函数调用非法 */
  BAD_CALL_FUNCTION,
}

export class HydrangeaError extends Error {
  private readonly _errno: HydrangeaErrorCode;
  constructor(errno: HydrangeaErrorCode, message?: string, option?: ErrorOptions) {
    super(message, option);
    this._errno = errno;
  }
  get errno() {
    return this._errno;
  }
  static TypeIllegalError(message?: string, option?: ErrorOptions) {
    return new HydrangeaError(ErrorCode.TYPE_ILLEGALITY, message, option);
  }
}
