import { LoggerFactory } from './factory';
import {
  ConsoleTransportOptions,
  FileTransportOptions,
  ILogger,
  LegacyLoggerOptions,
  LoggerOptions,
} from './interface';
import { MidwayLogger } from './logger';

export * from './interface';
export * from './logger';
export * from './transport/transport';
export * from './transport/file';
export * from './transport/console';
export * from './transport/fileStreamRotator';
export * from './factory';
export * from './util';

export const loggers = new LoggerFactory();
export const clearAllLoggers = () => {
  loggers.close();
};
export const createLogger = <T = ILogger>(
  name: string,
  options: LoggerOptions & LegacyLoggerOptions = {}
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
export type IMidwayLogger = MidwayLogger;
/**
 * @deprecated
 */
export const MidwayLoggerContainer = LoggerFactory;
/**
 * @deprecated
 */
export const MidwayBaseLogger = MidwayLogger;
