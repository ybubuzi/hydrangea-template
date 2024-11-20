export {};

declare global {
  interface PromisePair<T = any> {
    resolve: (...response: T[]) => void;
    reject: (error: Error) => void;
    lock?: boolean;
  }
}
