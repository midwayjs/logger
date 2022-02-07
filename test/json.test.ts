import { EggLogger } from 'egg-logger';
import { join } from 'path';
import { fileExists, includeContent, matchContentTimes, removeFileOrDir, sleep } from './util';
import { clearAllLoggers, createLogger, IMidwayLogger, LoggerOptions } from '../src';

describe('/test/json.test.ts', function () {
  it('should test egg logger output json', async () => {
    const logsDir = join(__dirname, 'logs')
    await removeFileOrDir(logsDir);
    const logger = new EggLogger({
      file: join(logsDir, 'test-json.log'),
      jsonFile: join(logsDir, 'test-json-1.json.log'),
      outputJSON: true,
      consoleLevel: 'ALL',
    });

    logger.info('abcd');
    logger.info({
      a: 1,
      b: 2
    });

    logger.error(new Error('abc'), 'bbb');
    logger.write('cccc');

    logger.close();
  });

  it('should test create logger with json output', async () => {
    const logsDir = join(__dirname, 'logs')
    await removeFileOrDir(logsDir);

    const logger = createLogger<IMidwayLogger>('testLogger', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      enableError: false,
      enableJSON: true,
      enableFile: false,
    });

    logger.info('abcd');
    logger.info('bcde');
    logger.info('efghi');
    logger.info({
      a: 1,
      b: 2
    });
    logger.error(new Error('abc'), 'bbb');
    logger.write('cccc');

    logger.close();

    expect(fileExists(join(logsDir, 'test-logger.json.log')));
    expect(includeContent(join(logsDir, 'test-logger.json.log'), 'Error: abc'))
    expect(includeContent(join(logsDir, 'test-logger.json.log'), '"level":"TRACE","message":"cccc"'))
    await removeFileOrDir(logsDir);
  });

  it('should test create logger with json output and custom format', async () => {
    const logsDir = join(__dirname, 'logs')
    await removeFileOrDir(logsDir);

    const logger = createLogger<IMidwayLogger>('testLogger', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      enableError: false,
      enableJSON: true,
      enableFile: false,
      jsonFormat: (info, meta) => {
        info.LEVEL = meta.LEVEL;
      }
    });

    logger.info('abcd');
    logger.info('bcde');
    logger.info('efghi');
    logger.info({
      a: 1,
      b: 2
    });

    logger.close();

    expect(fileExists(join(logsDir, 'test-logger.json.log')));
    expect(includeContent(join(logsDir, 'test-logger.json.log'), '"LEVEL":"INFO"'))
    await removeFileOrDir(logsDir);
  });

  it('should throw error when log name not set', function () {
    expect(() => {
      createLogger<IMidwayLogger>('testLogger', {
        enableError: false,
        enableJSON: true,
        enableFile: false,
      });
    }).toThrowError(/Please set jsonLogName when enable output json/);
  });

  it('should test createContextLogger from logger with custom context format and output json', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('testLogger', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      enableError: false,
      level: 'debug',
      enableJSON: true,
      printFormat: info => {
        return info.ctx.data + ' ' + info.message;
      },
      contextFormat: info => {
        return info.ctx.data + ' abc ' + info.message;
      },
      jsonFormat: (info, meta) => {
        info.data = meta.ctx.data;
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

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.json.log'),
        'custom data'
      )
    ).toEqual(2);

    await removeFileOrDir(logsDir);
  });

  it('should test create child logger with custom format and json output', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const loggerOptions = {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      disableError: true,
      printFormat: info => {
        return info.message;
      },
      level: 'warn',
      consoleLevel: 'debug',
      enableJSON: true,
      jsonFormat: (info, meta) => {
        info.data = 'ddd';
      }
    } as LoggerOptions;
    const logger = createLogger<IMidwayLogger>('testLogger', loggerOptions);

    const child = logger.createChildLogger({
      format: info => {
        return `child ${info.message}`;
      },
      jsonFormat: (info, meta) => {
        info.data = 'ccc';
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

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.json.log'),
        '"data":"ddd"'
      )
    ).toEqual(1);

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.json.log'),
        '"data":"ccc"'
      )
    ).toEqual(2);

    await removeFileOrDir(logsDir);
  });

  it('should test create context logger from child and json output', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const loggerOptions = {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      enableError: false,
      format: info => {
        return info.message;
      },
      level: 'warn',
      consoleLevel: 'debug',
      enableJSON: true,
      jsonFormat: (info, meta) => {
        info.data = 'ddd';
      }
    } as LoggerOptions;
    const logger = createLogger<IMidwayLogger>('testLogger', loggerOptions);

    const child = logger.createChildLogger({
      format: info => {
        return `child ${info.message}`;
      },
      jsonFormat: (info, meta) => {
        info.data = 'eee';
      }
    });

    const ctx = { data: 'custom data' };
    const contextLogger = child.createContextLogger(ctx, {
      contextFormat: info => {
        return `ctx ${info.message}`;
      },
      jsonFormat: (info, meta) => {
        info.data = 'fff';
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

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.json.log'),
        '"data":"ddd"'
      )
    ).toEqual(1);

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.json.log'),
        '"data":"eee"'
      )
    ).toEqual(2);

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.json.log'),
        '"data":"fff"'
      )
    ).toEqual(1);

    await removeFileOrDir(logsDir);
  });

});
