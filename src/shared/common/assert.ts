import { ErrorCode, HydrangeaError } from './hydrangea-error';
type TypeMapping = {
  array: Array<any>;
  map: Map<any, any>;
  set: Set<any>;
  date: Date;
  object: Object;
  function: Function;
  string: String;
  number: Number;
  bigint: BigInt;
  boolean: Boolean;
  symbol: Symbol;
  null: null;
  undefined: undefined;
};
function getValueType(value: any): keyof TypeMapping {
  if (Array.isArray(value)) {
    return 'array';
  } else if (value instanceof Map) {
    return 'map';
  } else if (value instanceof Set) {
    return 'set';
  } else if (value instanceof Date) {
    return 'date';
  } else if (value === null) {
    return 'null';
  } else {
    return typeof value;
  }
}
export function equalType<T, E = keyof TypeMapping>(value: unknown, expected: E, msg?: string): asserts value is T {
  if (getValueType(value) !== expected) {
    const message = msg ?? `value is not ${expected}`;
    throw HydrangeaError.TypeIllegalError(message);
  }
}

export function equalValue<T = any, U = any>(value: T, expected: U, msg?: string): asserts value is T & U {
  // @ts-ignore
  if (value != expected) {
    const message = msg ?? `value is not equal to expected`;
    throw new HydrangeaError(ErrorCode.VALUE_ILLEGALITY, message);
  }
}

export function notNil<T>(value: T, msg?: string): asserts value is T extends undefined | null ? never : T {
  if (!value) {
    const message = msg ?? `value is nil`;
    throw new HydrangeaError(ErrorCode.VALUE_ILLEGALITY, message);
  }
}
