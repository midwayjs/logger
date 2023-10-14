import { join } from 'path';
import { fileExists, includeContent, removeFileOrDir, sleep } from './util';
import { ConsoleTransport, FileTransport, MidwayLogger } from '../src';

describe('test/file.test.ts', function () {
  it('should test file logger with buffer', async () => {
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = new MidwayLogger({
      transports: {
        console: new ConsoleTransport(),
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'custom-logger.log',
          bufferWrite: true,
        }),
      }
    });

    logger.debug('test', 'test1', 'test2', 'test3');
    logger.warn('test', 'test4', 'test5', 123, new Error('bcd'));
    logger.error('test2', 'test6', 123, 'test7', new Error('ef'));

    await sleep(2000);

    expect(fileExists(join(logsDir, 'custom-logger.log'))).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        'test test1 test2 test3'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        'test test4 test5 123 Error: bcd'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        'test2 test6 123 test7 Error: ef'
      )
    ).toBeTruthy();

    logger.close();

    await removeFileOrDir(logsDir);
  });
})
