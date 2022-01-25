import { clearAllLoggers, createLogger, IMidwayLogger, LoggerOptions, MidwayContextLogger } from '../src';
import { join } from 'path';
import { matchContentTimes, removeFileOrDir, sleep } from './util';

describe('/test/contextLogger.test.ts', function () {

  it('should test contextLogger', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('testLogger', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      disableError: true,
      format: info => {
        return info.ctx.data + ' ' + info.message;
      },
    });

    const ctx = { data: 'custom data' };
    const contextLogger = new MidwayContextLogger(ctx, logger);

    contextLogger.info('hello world');
    contextLogger.debug('hello world');
    contextLogger.warn('hello world');
    contextLogger.error('hello world');

    await removeFileOrDir(logsDir);
  });

  it('should test createContextLogger from logger with custom context format', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('testLogger', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      disableError: true,
      level: 'debug',
      format: info => {
        return info.ctx.data + ' ' + info.message;
      },
      contextFormat: info => {
        return info.ctx.data + ' abc ' + info.message;
      }
    });

    const ctx = { data: 'custom data' };
    const contextLogger = logger.createContextLogger(ctx);

    const fn = jest.spyOn(logger, 'write');

    contextLogger.info('hello world');
    expect(fn.mock.calls[0][0].message).toEqual('hello world');
    contextLogger.debug('hello world');
    expect(fn.mock.calls[1][0].message).toEqual('hello world');

    await sleep();

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        'custom data abc hello world'
      )
    ).toEqual(2);

    await removeFileOrDir(logsDir);
  });

  it('should test create child logger', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const loggerOptions = {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      disableError: true,
      format: info => {
        return info.message;
      },
      level: 'warn',
      consoleLevel: 'debug'
    } as LoggerOptions;
    const logger = createLogger<IMidwayLogger>('testLogger', loggerOptions);

    const child = logger.createChildLogger();
    expect(child.getParentLogger()).toEqual(logger);
    expect(child.getFileLevel()).toEqual('warn');
    expect(child.getConsoleLevel()).toEqual('debug');
    expect(child.getLoggerOptions()).toEqual(loggerOptions);

    child.debug('111111');
    child.info('111111');
    child.warn('111111');
    child.error('111111');

    await sleep();

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        '111111'
      )
    ).toEqual(2);

    await removeFileOrDir(logsDir);
  });

  it('should test create child logger with custom format', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const loggerOptions = {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      disableError: true,
      format: info => {
        return info.message;
      },
      level: 'warn',
      consoleLevel: 'debug'
    } as LoggerOptions;
    const logger = createLogger<IMidwayLogger>('testLogger', loggerOptions);

    const child = logger.createChildLogger({
      format: info => {
        return `child ${info.message}`;
      }
    });

    logger.warn('111111')

    child.debug('111111');
    child.info('111111');
    child.warn('111111');
    child.error('111111');

    await sleep();

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        'child 111111'
      )
    ).toEqual(2);

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        '111111'
      )
    ).toEqual(3);

    await removeFileOrDir(logsDir);
  });

  it('should test create context logger from child', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const loggerOptions = {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      disableError: true,
      format: info => {
        return info.message;
      },
      level: 'warn',
      consoleLevel: 'debug'
    } as LoggerOptions;
    const logger = createLogger<IMidwayLogger>('testLogger', loggerOptions);

    const child = logger.createChildLogger({
      format: info => {
        return `child ${info.message}`;
      }
    });

    const ctx = { data: 'custom data' };
    const contextLogger = child.createContextLogger(ctx, {
      contextFormat: info => {
        return `ctx ${info.message}`;
      }
    });

    logger.warn('111111')

    child.info('111111');
    child.warn('111111');
    child.error('111111');

    contextLogger.info('111111');
    contextLogger.warn('111111');

    await sleep();

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        'child 111111'
      )
    ).toEqual(2);

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        '111111'
      )
    ).toEqual(4);

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        'ctx 111111'
      )
    ).toEqual(1);

    await removeFileOrDir(logsDir);
  });
});
