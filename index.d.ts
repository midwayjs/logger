import { ITransport, LoggerOptions, TransportUnionOptions } from './dist/index';

export * from './dist/index';

type WithoutITransport<T> = {
  [P in keyof T]: Exclude<T[P], ITransport>;
};

type NewTransportUnionOptions = WithoutITransport<TransportUnionOptions>;

interface ConfigLoggerOptions extends LoggerOptions {
  /**
   * Output transport
   */
  transports?: NewTransportUnionOptions;
}

declare module '@midwayjs/core/dist/interface' {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface MidwayLoggerOptions extends ConfigLoggerOptions {}
}
