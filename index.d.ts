import { LoggerOptions } from './dist/index';

export * from './dist/index';

declare module '@midwayjs/core/dist/interface' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MidwayLoggerOptions extends LoggerOptions {}
}
