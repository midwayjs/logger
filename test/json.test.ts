import { join } from 'path';
import { fileExists, includeContent, matchContentTimes, removeFileOrDir, sleep } from './util';
import { clearAllLoggers, createLogger, IMidwayLogger, JSONTransport, LoggerInfo, FileTransport } from '../src';
import { FileStreamRotatorManager } from '../src/transport/fileStreamRotator';

describe('/test/json.test.ts', function () {

  afterEach(() => {
    FileStreamRotatorManager.clear();
  });

  it('should test create logger with json output', async () => {
    const logsDir = join(__dirname, 'logs')
    await removeFileOrDir(logsDir);

    const logger = createLogger<IMidwayLogger>('testLogger', {
      transports: {
        json: new JSONTransport({
          dir: logsDir,
          fileLogName: 'test-logger.json.log',
        }),
      }
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
      transports: {
        json: new JSONTransport({
          dir: logsDir,
          fileLogName: 'test-logger.json.log',
          format: (info: LoggerInfo & {ttt: string}) => {
            info.ttt = info.LEVEL;
            return info;
          }
        }),
      },
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

  // it('should throw error when log name not set', function () {
  //   expect(() => {
  //     createLogger<IMidwayLogger>('testLogger', {
  //       enableError: false,
  //       enableJSON: true,
  //       enableFile: false,
  //     });
  //   }).toThrowError(/Please set jsonLogName when enable output json/);
  // });

  it('should test createContextLogger from logger with custom context format and output json', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('testLogger', {
      transports: {
        file: new FileTransport({
          level: 'debug',
          dir: logsDir,
          fileLogName: 'test-logger.log',
          format: info => {
            return info.ctx.data + ' ' + info.message;
          },
          contextFormat: info => {
            return info.ctx.data + ' abc ' + info.message;
          }
        }),
        json: new JSONTransport({
          level: 'debug',
          dir: logsDir,
          fileLogName: 'test-logger.json.log',
          format: (info: LoggerInfo & {data: string}) => {
            info.data = info.ctx.data;
            return info;
          }
        }),
      },
    });

    const ctx = { data: 'custom data' };
    const contextLogger = logger.createContextLogger(ctx);

    const fn = jest.spyOn(logger, 'transit');

    contextLogger.info('hello world');
    expect(fn.mock.calls[0][2]).toEqual('hello world');
    contextLogger.debug('hello world');
    expect(fn.mock.calls[1][2]).toEqual('hello world');

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

});
