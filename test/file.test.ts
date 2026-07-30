import { join } from 'path';
import { fileExists, includeContent, removeFileOrDir, sleep } from './util';
import { ConsoleTransport, FileTransport, MidwayLogger } from '../src';
import { FileStreamRotatorManager } from '../src/transport/fileStreamRotator';

describe('test/file.test.ts', function () {
  afterEach(() => {
    FileStreamRotatorManager.clear();
  });

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

  it('should release pooled stream listeners when transports close', async () => {
    const logsDir = join(__dirname, 'listener-cleanup-logs');
    await removeFileOrDir(logsDir);
    const options = {
      dir: logsDir,
      fileLogName: 'listener-cleanup.log',
      maxSize: '10m',
      maxFiles: 5,
      zippedArchive: true,
      createSymlink: false,
    };
    const first = new FileTransport(options);
    const second = new FileTransport(options);
    const pooledStream = (first as any).logStream;

    expect((second as any).logStream).toBe(pooledStream);
    expect(pooledStream.listenerCount('logRemoved')).toBe(2);
    expect(pooledStream.listenerCount('rotate')).toBe(2);

    first.close();
    expect(pooledStream.listenerCount('logRemoved')).toBe(1);
    expect(pooledStream.listenerCount('rotate')).toBe(1);
    expect(pooledStream.canWrite()).toBe(true);

    second.close();
    expect(pooledStream.listenerCount('logRemoved')).toBe(0);
    expect(pooledStream.listenerCount('rotate')).toBe(0);

    const third = new FileTransport(options);
    expect((third as any).logStream).not.toBe(pooledStream);
    third.close();

    await removeFileOrDir(logsDir);
  });
});
