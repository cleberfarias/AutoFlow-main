// Global ambient declarations to smooth incremental TS migration
declare module 'lru-cache' {
  const LRU: any;
  export default LRU;
}

declare module 'node-fetch' {
  const fetch: any;
  export default fetch;
}

interface Error {
  status?: number;
  code?: string | number;
}

declare const vi: any;
declare namespace vi {
  export type Mock = any;
  export function spyOn(...args: any[]): any;
  export function doMock(...args: any[]): any;
  export function fn<T = any>(): any;
}

declare var fetch: any;
declare var global: any;
declare var globalThis: any;

declare global {
  var fetch: any;
  var __AUTOFLOW_METRICS__: any;
}

interface ImportMetaEnv {
  VITE_CHATGURU_API_BASE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
