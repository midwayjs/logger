import { LoggerOptions } from './dist/index';

export * from './dist/index';

declare module '@midwayjs/core/dist/interface' {
  interface MidwayLoggerOptions extends LoggerOptions {}
}
