import {
  Logger,
  ConsoleTransport,
  FileTransport,
  createConsoleLogger,
  clearAllLoggers,
  createLogger,
  loggers,
  ILogger,
  IMidwayLogger,
  EmptyTransport,
  createFileLogger, JSONTransport,
} from '../src';
import { join } from 'path';
import {
  createChildProcess,
  fileExists,
  finishLogger,
  getCurrentDateString,
  includeContent, matchContentTimes,
  removeFileOrDir,
  sleep
} from './util';
import * as os from 'os';
import { readdirSync, readFileSync, writeFileSync } from 'fs';
import { supportsColor } from '../src/util/color';

describe('/test/index.test.ts', () => {
  afterEach(() => {
    jest.clearAllMocks();
    jest.resetAllMocks();
  });

  it('should output with console transport', () => {
    const logger = new Logger();
    logger.add('console', new ConsoleTransport());

    const fnStdout = jest.spyOn(process.stdout, 'write');
    const fnStderr = jest.spyOn(process.stderr, 'write');

    logger.verbose('test', 'test1', 'test2', 'test3');
    expect(fnStdout.mock.calls[0][0]).toContain('test test1 test2 test3');

    logger.silly('test', 123, 'test2', 'test3');
    expect(fnStdout.mock.calls[1][0]).toContain('test 123 test2 test3');

    logger.info('test', 123, [3, 2, 1], 'test3', new Error('abc'));
    expect(fnStdout.mock.calls[2][0]).toContain('test 123 [ 3, 2, 1 ] test3 Error: abc');

    logger.info('test', new Error('bcd'));
    expect(fnStdout.mock.calls[3][0]).toContain('test Error: bcd');

    logger.info('test', new Error('bcd'), new Error('cdd'));
    expect(fnStdout.mock.calls[4][0]).toContain('test Error: bcd');
    expect(fnStdout.mock.calls[4][0]).toContain('Error: cdd');

    logger.info('%s %d', 'aaa', 222);
    expect(fnStdout.mock.calls[5][0]).toContain('aaa 222');

    // 单个数据
    // string
    logger.error('plain error message');
    expect(fnStderr.mock.calls[0][0]).toContain('plain error message');
    // number
    logger.error(123);
    expect(fnStderr.mock.calls[1][0]).toContain('123');
    // array
    logger.error(['b', 'c']);
    expect(fnStderr.mock.calls[2][0]).toContain('[ \'b\', \'c\' ]');
    // string + number
    logger.error('plain error message', 321);
    expect(fnStderr.mock.calls[3][0]).toContain('plain error message 321');
    // format
    logger.error('format log, %j', {a: 1});
    expect(fnStderr.mock.calls[4][0]).toContain('format log, {"a":1}');
    // set
    logger.info(new Set([2, 3, 4]));
    expect(fnStdout.mock.calls[6][0]).toContain('{ 2, 3, 4 }');
    // map
    logger.info(
      new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ])
    );
    expect(fnStdout.mock.calls[7][0]).toContain('{ \'key1\' => \'value1\', \'key2\' => \'value2\' }');
    // warn object
    logger.warn({name: 'Jack'});
    expect(fnStdout.mock.calls[8][0]).toContain('{ name: \'Jack\' }');
    // error object
    logger.error(new Error('error instance'));
    expect(fnStderr.mock.calls[5][0]).toContain('Error: error instance');
    // named error
    const error = new Error('named error instance');
    error.name = 'NamedError';
    // 直接输出 error
    logger.error(error);
    expect(fnStderr.mock.calls[6][0]).toContain('NamedError');
    expect(fnStderr.mock.calls[6][0]).toContain('named error instance');

    logger.close();
  });

  it('should test create logger with file transport', async () => {
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const coreLogger = new Logger({
      transports: {
        console: new ConsoleTransport(),
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'midway-core.log'
        }),
        error: new FileTransport({
          level: 'error',
          dir: logsDir,
          fileLogName: 'common-error.log',
        }),
      }
    });

    expect(coreLogger.get('console').level).toEqual('silly');
    expect(coreLogger.get('file').level).toEqual('silly');

    coreLogger.info('hello world1');
    coreLogger.info('hello world2');
    coreLogger.info('hello world3');
    coreLogger.warn('hello world4');
    coreLogger.error('hello world5');
    // 调整完之后控制台应该看不见了，但是文件还写入

    coreLogger.get('console').level = 'warn';
    expect(coreLogger.get('console').level).toEqual('warn');
    coreLogger.info('hello world6');
    coreLogger.info('hello world7');
    coreLogger.info('hello world8');

    // 文件也不会写入了
    coreLogger.get('file').level = 'warn';
    expect(coreLogger.get('file').level).toEqual('warn');
    coreLogger.info('hello world9');
    coreLogger.info('hello world10');
    coreLogger.info('hello world11');

    await sleep();
    // test logger file exist
    expect(fileExists(join(logsDir, 'midway-core.log'))).toBeTruthy();
    expect(fileExists(join(logsDir, 'common-error.log'))).toBeTruthy();

    // test logger file include content
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world1')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world2')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world3')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world4')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world5')
    ).toBeTruthy();

    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world6')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world7')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world8')
    ).toBeTruthy();

    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world9')
    ).toBeFalsy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world10')
    ).toBeFalsy();
    expect(
      includeContent(join(logsDir, 'midway-core.log'), 'hello world11')
    ).toBeFalsy();

    // test error logger  file include content
    expect(
      includeContent(join(logsDir, 'common-error.log'), 'hello world1')
    ).toBeFalsy();
    expect(
      includeContent(join(logsDir, 'common-error.log'), 'hello world5')
    ).toBeTruthy();

    // test default eol
    expect(
      includeContent(join(logsDir, 'midway-core.log'), os.EOL)
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'common-error.log'), os.EOL)
    ).toBeTruthy();

    coreLogger.close();
    await removeFileOrDir(logsDir);
  });

  it('should create logger in cluster mode', async () => {
    const logsDir = join(__dirname, 'fixtures/logs');
    await removeFileOrDir(logsDir);
    const clusterFile = join(__dirname, 'fixtures/cluster.ts');
    const child = createChildProcess(clusterFile);
    const pidList = await new Promise<any>(resolve => {
      child.on('message', pidList => {
        resolve(pidList);
      });
    });

    await new Promise<void>(resolve => {
      child.on('exit', () => {
        // 等进程退出
        resolve();
      });
    });
    // test logger file exist
    expect(fileExists(join(logsDir, 'midway-core.log'))).toBeTruthy();
    console.log(join(logsDir, 'midway-core.log'));
    console.log(
      readFileSync(join(logsDir, 'midway-core.log'), {
        encoding: 'utf8',
      })
    );

    for (const pid of pidList) {
      expect(
        includeContent(join(logsDir, 'midway-core.log'), pid)
      ).toBeTruthy();
    }

    await removeFileOrDir(logsDir);
  });

  it('should create custom logger and output content', async () => {
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = new Logger({
      transports: {
        console: new ConsoleTransport(),
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'custom-logger.log',
        }),
      }
    });

    logger.debug('test', 'test1', 'test2', 'test3');
    logger.warn('test', 'test4', 'test5', 123, new Error('bcd'));
    logger.error('test2', 'test6', 123, 'test7', new Error('ef'), {
      label: '123',
    });
    // logger.info('hello world', { label: ['a', 'b'] });
    // logger.warn('warn: hello world', { label: 'UserService' });
    logger.info('%s %d', 'aaa', 222);
    // string
    logger.error('plain error message');
    // number
    logger.error(123);
    // array
    logger.error(['b', 'c']);
    // string + number
    logger.error('plain error message', 321);
    // format
    logger.error('format log, %j', {a: 1});
    // array
    logger.info(['Jack', 'Joe']);
    // set
    logger.info(new Set([2, 3, 4]));
    // map
    logger.info(
      new Map([
        ['key1', 'value1'],
        ['key2', 'value2'],
      ])
    );
    // warn object
    logger.warn({name: 'Jack'});
    // error object
    logger.error(new Error('error instance'));
    // named error
    const error = new Error('named error instance');
    error.name = 'NamedError';
    // 直接输出 error
    logger.error(error);
    // 文本在前，加上 error 实例
    logger.info([1, 2, 3]);
    logger.info(new Error('info - error instance'));
    logger.info(
      'info - text before error',
      new Error('error instance after text')
    );
    logger.error(
      'error - text before error',
      new Error('error instance after text')
    );

    await finishLogger(logger);

    expect(fileExists(join(logsDir, 'custom-logger.log'))).toBeTruthy();
    expect(fileExists(join(logsDir, 'common-error.log'))).toBeFalsy();
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
    // expect(
    //   includeContent(join(logsDir, 'custom-logger.log'), '[a:b] hello world')
    // ).toBeTruthy();
    // expect(
    //   includeContent(
    //     join(logsDir, 'custom-logger.log'),
    //     '[UserService] warn: hello world'
    //   )
    // ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), 'aaa 222')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), 'plain error message')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), '123')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), '[ \'b\', \'c\' ]')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), '{ 2, 3, 4 }')
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        '{ \'key1\' => \'value1\', \'key2\' => \'value2\' }'
      )
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), 'plain error message')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), 'format log, {"a":1}')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), '[ \'Jack\', \'Joe\' ]')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'custom-logger.log'), '{ name: \'Jack\' }')
    ).toBeTruthy();
    // error
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        'named error instance'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        'info - text before error'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'custom-logger.log'),
        'error - text before error'
      )
    ).toBeTruthy();
    await removeFileOrDir(logsDir);
  });

  it('should create console file', async () => {
    await removeFileOrDir(join(process.cwd(), 'common-error.log'));
    const consoleLogger = createConsoleLogger('consoleLogger');
    consoleLogger.debug('test', 'test1', 'test2', 'test3');
    consoleLogger.error('test console error');
    console.log('---');
    const err = new Error('custom error');
    err.name = 'MyCustomError';
    consoleLogger.error(err);
    consoleLogger.error(err, {label: 123});
    consoleLogger.error('before:', err);
    console.log('---');
    consoleLogger.info('启动耗时 %d ms', 111);
    consoleLogger.info('%j', {a: 1});
    consoleLogger.debug('1', '2', '3');
    consoleLogger.info('plain error message', 321);

    expect(fileExists(join(process.cwd(), 'common-error.log'))).toBeFalsy();
  });

  it('should create logger and update configure', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<Logger>('testLogger', {
      transports: {
        console: new ConsoleTransport(),
      }
    });

    logger.error(new Error('test error'));
    await sleep();
    expect(fileExists(join(logsDir, 'test-logger.log'))).toBeFalsy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test error')
    ).toBeFalsy();

    logger.add('file', new FileTransport({
      dir: logsDir,
      fileLogName: 'test-logger.log',
    }));
    logger.error(new Error('another test error'));
    logger.info('this is a info message with empty label', {label: []});
    logger.info('this is a info message with empty value label', {label: ''});
    logger.info('this is a info message with value label', {label: 'ddd'});
    logger.info('this is a info message with array value label', {
      label: ['ccc', 'aaa'],
    });

    await sleep();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'another test error')
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'test-logger.log'),
        'this is a info message with empty label'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'test-logger.log'),
        'this is a info message with empty label'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'test-logger.log'),
        'this is a info message with value label'
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'test-logger.log'),
        'this is a info message with array value label'
      )
    ).toBeTruthy();

    await removeFileOrDir(logsDir);
  });

  it('should create logger with no symlink', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const timeFormat = getCurrentDateString();
    const logger = createLogger<Logger>('testLogger', {
      format: (info) => {
        return `${info.level.toUpperCase()} ${process.pid} ${info.args}`;
      },
      transports: {
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'test-logger.log',
          createSymlink: false,
        }),
        error: new FileTransport({
          level: 'error',
          dir: logsDir,
          fileLogName: 'test-error.log',
          createSymlink: false,
        })
      },
    });

    logger.error('test console error');

    await sleep();
    expect(fileExists(join(logsDir, 'test-logger.log'))).toBeFalsy();
    expect(fileExists(join(logsDir, 'test-error.log'))).toBeFalsy();
    expect(
      fileExists(join(logsDir, 'test-logger.log.' + timeFormat))
    ).toBeTruthy();
    expect(
      fileExists(join(logsDir, 'test-error.log.' + timeFormat))
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'test-logger.log.' + timeFormat),
        `ERROR ${process.pid} test console error`
      )
    ).toBeTruthy();
    expect(
      includeContent(
        join(logsDir, 'test-logger.log.' + timeFormat),
        `ERROR ${process.pid} test console error`
      )
    ).toBeTruthy();
    await removeFileOrDir(logsDir);
  });

  it('should test container and create same logger', async () => {
    if (loggers.size > 0) {
      clearAllLoggers();
    }
    const logger1 = createConsoleLogger('consoleLogger');
    createConsoleLogger('anotherConsoleLogger');
    const logger3 = createConsoleLogger('consoleLogger');
    expect(logger1).toEqual(logger3);
    expect(loggers.size).toEqual(2);
    clearAllLoggers();
    expect(loggers.size).toEqual(0);
  });

  it('should test container with add logger', function () {
    if (loggers.size > 0) {
      clearAllLoggers();
    }
    const originLogger: any = createConsoleLogger('consoleLogger');
    expect(loggers.size).toEqual(1);
    const logger = new Logger();
    // 重复添加会报错
    expect(() => {
      loggers.addLogger('consoleLogger', logger);
    }).toThrow();
    expect(loggers.size).toEqual(1);
    let consoleLogger: ILogger = loggers.getLogger('consoleLogger');
    expect(originLogger).toEqual(consoleLogger);

    // 允许重复添加，且直接返回原对象
    loggers.addLogger('consoleLogger', originLogger, false);
    expect(loggers.size).toEqual(1);
    consoleLogger = loggers.getLogger('consoleLogger');
    expect(originLogger).toEqual(consoleLogger);

    // 允许重复添加，且替换原来的对象
    loggers.addLogger('consoleLogger', logger, false);
    expect(loggers.size).toEqual(1);
    consoleLogger = loggers.getLogger('consoleLogger');
    expect(logger).toEqual(consoleLogger);

    loggers.close('consoleLogger');
    expect(loggers.size).toEqual(0);
  });

  it('should create logger update level', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger = createLogger<IMidwayLogger>('testLogger', {
      format: (info) => {
        return `${info.level.toUpperCase()} ${process.pid} ${info.args}`;
      },
      transports: {
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'test-logger.log',
        }),
        error: new FileTransport({
          level: 'error',
          dir: logsDir,
          fileLogName: 'test-error.log',
        })
      },
    });

    logger.info('test console info');
    logger.error('test console error');

    await sleep();
    expect(fileExists(join(logsDir, 'test-error.log'))).toBeTruthy();
    expect(fileExists(join(logsDir, 'test-logger.log'))).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'test-error.log'), 'test console error')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test console error')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test console info')
    ).toBeTruthy();

    // after update level

    logger.level = 'warn';

    logger.info('test console info2');
    logger.error('test console error2');

    await sleep();
    expect(
      includeContent(join(logsDir, 'test-error.log'), 'test console error2')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test console error2')
    ).toBeTruthy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test console info2')
    ).toBeFalsy();

    // after disable error and file

    logger.remove('error');
    logger.remove('file');

    logger.info('test console info3');
    logger.error('test console error3');
    await sleep();
    expect(
      includeContent(join(logsDir, 'test-error.log'), 'test console error3')
    ).toBeFalsy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test console error3')
    ).toBeFalsy();
    expect(
      includeContent(join(logsDir, 'test-logger.log'), 'test console info3')
    ).toBeFalsy();

    // logger.enableFile();
    // logger.enableError();
    //
    // logger.warn('test console info4');
    // logger.error('test console error4');
    // await sleep();
    // expect(includeContent(join(logsDir, 'test-error.log'), 'test console error4')).toBeTruthy();
    // expect(includeContent(join(logsDir, 'test-logger.log'), 'test console error4')).toBeTruthy();
    // expect(includeContent(join(logsDir, 'test-logger.log'), 'test console info4')).toBeTruthy();

    await removeFileOrDir(logsDir);
  });

  it('should test common-error log', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger1 = createLogger<IMidwayLogger>('logger', {
      transports: {
        error: new FileTransport({
          level: 'error',
          dir: logsDir,
          fileLogName: 'common-error.log',
        })
      },
    });

    const logger2 = createLogger<IMidwayLogger>('logger', {
      transports: {
        error: new FileTransport({
          level: 'error',
          dir: logsDir,
          fileLogName: 'common-error.log',
        })
      },
    });

    expect(logger1).toEqual(logger2);
    logger1.error('output error by logger1');
    logger2.error('output error by logger2');

    await sleep();

    expect(
      matchContentTimes(
        join(logsDir, 'common-error.log'),
        'output error by logger1'
      )
    ).toEqual(1);
    expect(
      matchContentTimes(
        join(logsDir, 'common-error.log'),
        'output error by logger2'
      )
    ).toEqual(1);
    await removeFileOrDir(logsDir);
  });

  it('should use write method to file', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('logger', {
      transports: {
        file: new FileTransport({
          level: 'info',
          dir: logsDir,
          fileLogName: 'midway-core.log',
        })
      },
    });
    logger.write('hello world');
    const buffer = Buffer.from('hello world', 'utf-8');
    logger.write(buffer);

    await sleep();
    expect(
      matchContentTimes(
        join(logsDir, 'midway-core.log'),
        process.pid.toString()
      )
    ).toEqual(0);
    expect(
      matchContentTimes(join(logsDir, 'midway-core.log'), 'hello world')
    ).toEqual(2);
    await removeFileOrDir(logsDir);
  });

  it('should use write method to file and not write to error file', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);
    const logger = createLogger<IMidwayLogger>('logger', {
      transports: {
        file: new FileTransport({
          level: 'silly',
          dir: logsDir,
          fileLogName: 'midway-core.log',
        })
      },
    });
    logger.write('hello world');
    const buffer = Buffer.from('hello world', 'utf-8');
    logger.write(buffer);

    await sleep();

    expect(
      matchContentTimes(join(logsDir, 'midway-core.log'), 'hello world')
    ).toEqual(2);

    expect(
      matchContentTimes(
        join(logsDir, 'common-error.log'),
        'hello world'
      )
    ).toEqual(0);
    await removeFileOrDir(logsDir);
  });

  it('should custom transport', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    class CustomTransport extends EmptyTransport {
      log(level, meta, ...args) {
        const levelLowerCase = level;
        if (levelLowerCase === 'error' || levelLowerCase === 'warn') {
          writeFileSync(join(logsDir, 'test.log'), args[0] + os.EOL);
        }
      }
    }

    const logger = createLogger<IMidwayLogger>('logger', {
      transports: {
        file: new FileTransport({
          level: 'info',
          dir: logsDir,
          fileLogName: 'midway-core.log',
        })
      },
    });

    const customTransport = new CustomTransport({
      level: 'warn',
    });
    logger.add('custom', customTransport);
    logger.info('hello world info');
    logger.warn('hello world warn');
    logger.remove('custom');
    logger.warn('hello world another warn');
    await sleep();

    expect(
      matchContentTimes(join(logsDir, 'midway-core.log'), 'hello world info')
    ).toEqual(1);
    expect(
      matchContentTimes(join(logsDir, 'midway-core.log'), 'hello world warn')
    ).toEqual(1);
    expect(
      matchContentTimes(
        join(logsDir, 'midway-core.log'),
        'hello world another warn'
      )
    ).toEqual(1);

    expect(
      matchContentTimes(join(logsDir, 'test.log'), 'hello world info')
    ).toEqual(0);
    expect(
      matchContentTimes(join(logsDir, 'test.log'), 'hello world warn')
    ).toEqual(1);
    expect(
      matchContentTimes(join(logsDir, 'test.log'), 'hello world another warn')
    ).toEqual(0);

    await removeFileOrDir(logsDir);
  });

  it('should test createFileLogger', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger = createFileLogger('file', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
    });

    logger.info('file logger');
    await sleep();

    expect(
      matchContentTimes(join(logsDir, 'test-logger.log'), 'file logger')
    ).toEqual(1);

    await removeFileOrDir(logsDir);
  });

  it('should change eol', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger = createFileLogger('file', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      eol: 'bbb\n',
    });

    logger.info('file logger');
    logger.info('file logger1');
    logger.info('file logger2');
    await sleep();

    expect(
      matchContentTimes(join(logsDir, 'test-logger.log'), 'bbb\n')
    ).toEqual(3);

    await removeFileOrDir(logsDir);
  });

  it('should no output when level = none', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger = createFileLogger('file', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      level: 'none',
    });

    logger.info('file logger');
    logger.info('file logger1');
    logger.info('file logger2');
    await sleep();

    expect(
      matchContentTimes(join(logsDir, 'test-logger.log'), 'file logger')
    ).toEqual(0);
    await removeFileOrDir(logsDir);
  });

  it('should output all level when level = all', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger = createFileLogger('file', {
      dir: logsDir,
      fileLogName: 'test-logger.log',
      level: 'all',
    });

    logger.info('file logger');
    logger.info('file logger1');
    logger.info('file logger2');
    await sleep();

    expect(
      matchContentTimes(join(logsDir, 'test-logger.log'), 'file logger')
    ).toEqual(3);
    await removeFileOrDir(logsDir);
  });

  it('should test color with console', function () {
    clearAllLoggers();
    process.env.FORCE_ENABLE_COLOR = 'true';
    const fnStdout = jest.spyOn(process.stdout, 'write');
    const fnStderr = jest.spyOn(process.stderr, 'write');
    const consoleLogger = createConsoleLogger('consoleLogger', {
      autoColors: true,
    });
    consoleLogger.debug('test', 'test1', 'test2', 'test3');
    consoleLogger.info('test', 'test1', 'test2', 'test3');
    consoleLogger.warn('test', 'test1', 'test2', 'test3');
    consoleLogger.error('test', 'test1', 'test2', 'test3');
    expect(fnStdout.mock.calls[0][0]).toContain('\x1B');
    expect(fnStderr.mock.calls[0][0]).toContain('\x1B');
    process.env.FORCE_ENABLE_COLOR = undefined;
  });

  it('should test auto color with console', function () {
    clearAllLoggers();
    const fnStdout = jest.spyOn(process.stdout, 'write');
    const fnStderr = jest.spyOn(process.stderr, 'write');
    const consoleLogger = createConsoleLogger('consoleLogger', {
      autoColors: true,
    });
    consoleLogger.debug('test', 'test1', 'test2', 'test3');
    consoleLogger.info('test', 'test1', 'test2', 'test3');
    consoleLogger.warn('test', 'test1', 'test2', 'test3');
    consoleLogger.error('test', 'test1', 'test2', 'test3');

    const isTerminalSupportColor = supportsColor.stdout;
    if (isTerminalSupportColor) {
      expect(fnStdout.mock.calls[0][0]).toContain('\x1B');
      expect(fnStderr.mock.calls[0][0]).toContain('\x1B');
    } else {
      expect(fnStdout.mock.calls[0][0]).not.toContain('\x1B');
      expect(fnStderr.mock.calls[0][0]).not.toContain('\x1B');
    }
  });

  it('should test no color with console', function () {
    clearAllLoggers();
    const fn = jest.spyOn(process.stdout, 'write');
    const consoleLogger = createConsoleLogger('consoleLogger');
    consoleLogger.debug('test', 'test1', 'test2', 'test3');
    expect(fn.mock.calls[0][0]).not.toContain('\x1B');
  });

  it('should check info content', function () {
    const fn = jest.fn();
    const logger = createConsoleLogger(
      'globalOutputConsoleLogger',
      {
        format: fn,
      }
    ) as ILogger;

    logger.info('test', 'test1', 'test2', 'test3');
    expect(fn.mock.calls[0][0].originArgs).toEqual(['test', 'test1', 'test2', 'test3']);

    const err = new Error('abc');
    logger.info(err);
    expect(fn.mock.calls[1][0].args[0]).toEqual(err);

    const err2 = new Error('abc2');
    logger.info('abc', err2);
    expect(fn.mock.calls[2][0].args[1]).toEqual(err2);
  });

  it('should test change audit file logs', async () => {
    clearAllLoggers();
    const logsDir = join(__dirname, 'logs');
    await removeFileOrDir(logsDir);

    const logger = createLogger('file', {
      transports: {
        file: new FileTransport({
          dir: logsDir,
          fileLogName: 'test-logger.log',
          auditFileDir: join(logsDir, 'tmp'),
        }),
        json: new JSONTransport({
          dir: logsDir,
          fileLogName: 'test-logger.json.log',
          auditFileDir: join(logsDir, 'tmp'),
        }),
      }
    });

    logger.info('file logger');
    logger.info('file logger1');
    logger.error('file logger2');
    await sleep();

    const dir = readdirSync(join(logsDir, 'tmp'));
    expect(dir.length).toEqual(2);

    await removeFileOrDir(logsDir);
  });

});
