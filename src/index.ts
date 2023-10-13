import { LoggerFactory } from './factory';
import { ConsoleTransport } from './transport/console';
import { FileTransport } from './transport/file';
import {
  ConsoleTransportOptions,
  FileTransportOptions,
  ILogger,
  LoggerOptions,
} from './interface';
import { Logger } from './logger';

export * from './interface';
export * from './logger';
export * from './transport/transport';
export * from './transport/file';
export * from './transport/console';

export const loggers = new LoggerFactory();
export const clearAllLoggers = () => {
  loggers.close();
};
export const createLogger = <T = ILogger>(
  name: string,
  options: LoggerOptions = {}
): T => {
  return loggers.createLogger(name, options) as T;
};
export const createFileLogger = (
  name: string,
  options: FileTransportOptions
) => {
  return loggers.createLogger(name, {
    transports: {
      file: new FileTransport({
        dir: __dirname,
        fileLogName: 'custom-logger.log',
        ...options,
      }),
    },
  });
};
export const createConsoleLogger = (
  name: string,
  options: ConsoleTransportOptions = {}
) => {
  return loggers.createLogger(name, {
    transports: {
      console: new ConsoleTransport(options),
    },
  });
};

/**
 * @deprecated
 */
export type IMidwayLogger = Logger;
