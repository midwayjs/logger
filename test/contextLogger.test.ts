import { clearAllLoggers, createLogger, IMidwayLogger, FileTransport, MidwayContextLogger, ConsoleTransport } from '../src';
import { join } from 'path';
import { matchContentTimes, removeFileOrDir, sleep } from './util';

describe('/test/contextLogger.test.ts', function () {

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should test contextLogger', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('testLogger', {
      transports: {
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'test-logger.log',
          format: info => {
            return info.ctx.data + ' ' + info.message;
          },
        }),
      }
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
      transports: {
        console: new ConsoleTransport(),
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
      },
    });

    const ctx = { data: 'custom data' };
    const contextLogger = logger.createContextLogger(ctx);

    const fn = jest.spyOn(process.stdout, 'write');

    contextLogger.info('hello world');
    expect(fn.mock.calls[0][0]).toContain('hello world');
    contextLogger.debug('hello world');
    expect(fn.mock.calls[1][0]).toContain('hello world');

    await sleep();

    expect(
      matchContentTimes(
        join(logsDir, 'test-logger.log'),
        'custom data abc hello world'
      )
    ).toEqual(2);

    await removeFileOrDir(logsDir);
  });
});
