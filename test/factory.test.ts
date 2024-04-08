import { LoggerFactory } from '../src/factory';
import { LoggerOptions } from '../src/interface';
import { MidwayLogger } from '../src/logger';

describe('LoggerFactory', () => {
  let factory: LoggerFactory;
  let loggerOptions: LoggerOptions;

  beforeEach(() => {
    factory = new LoggerFactory();
    loggerOptions = {
      level: 'info',
      // Add other logger options as needed
    };
  });

  test('should create a logger', () => {
    const logger = factory.createLogger('test', loggerOptions);
    expect(logger).toBeInstanceOf(MidwayLogger);
  });

  test('should add a logger', () => {
    const logger = new MidwayLogger(loggerOptions);
    const addedLogger = factory.addLogger('test', logger);
    expect(addedLogger).toEqual(logger);
  });

  test('should get a logger', () => {
    factory.createLogger('test', loggerOptions);
    const logger = factory.getLogger('test');
    expect(logger).toBeInstanceOf(MidwayLogger);
  });

  test('should remove a logger', () => {
    factory.createLogger('test', loggerOptions);
    factory.removeLogger('test');
    const logger = factory.getLogger('test');
    expect(logger).toBeUndefined();
  });

  test('should close all loggers', () => {
    factory.createLogger('test1', loggerOptions);
    factory.createLogger('test2', loggerOptions);
    factory.close();
    const logger1 = factory.getLogger('test1');
    const logger2 = factory.getLogger('test2');
    expect(logger1).toBeUndefined();
    expect(logger2).toBeUndefined();
  });


  test('should get default midway logger config', () => {
    const appInfo = {
      pkg: {},
      name: 'testApp',
      baseDir: '/base/dir',
      appDir: '/app/dir',
      HOME: '/home/dir',
      root: '/root/dir',
      env: 'local',
    };

    const config = factory.getDefaultMidwayLoggerConfig(appInfo);

    expect(config).toBeDefined();
    expect(config.midwayLogger.default.dir).toEqual('/root/dir/logs/testApp');
    expect(config.midwayLogger.default.fileLogName).toEqual('midway-app.log');
    expect(config.midwayLogger.default.errorLogName).toEqual('common-error.log');
    expect(config.midwayLogger.default.transports.console['autoColors']).toBeTruthy();
    expect(config.midwayLogger.default.transports.file.bufferWrite).toBeFalsy();
    expect(config.midwayLogger.default.transports.error.bufferWrite).toBeFalsy();
    expect(config.midwayLogger.clients.coreLogger.fileLogName).toEqual('midway-core.log');
  });
});
