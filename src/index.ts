import { LoggerFactory } from './factory';
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
      file: {
        dir: __dirname,
        fileLogName: 'custom-logger.log',
        ...options,
      },
    },
  });
};
export const createConsoleLogger = (
  name: string,
  options: ConsoleTransportOptions = {}
) => {
  return loggers.createLogger(name, {
    transports: {
      console: options,
    },
  });
};

/**
 * @deprecated
 */
export type IMidwayLogger = Logger;
