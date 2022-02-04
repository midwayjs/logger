import { transports, format } from 'winston';
import { DailyRotateFileTransport } from '../transport/rotate';
import {
  LoggerLevel,
  LoggerOptions,
  IMidwayLogger,
  MidwayTransformableInfo,
  LoggerCustomInfoHandler,
  ChildLoggerOptions,
  ContextLoggerOptions,
} from '../interface';
import { EmptyTransport } from '../transport';
import { displayLabels, displayCommonMessage } from '../format';
import * as os from 'os';
import { basename, dirname, isAbsolute } from 'path';
import * as util from 'util';
import { ORIGIN_ARGS, ORIGIN_ERROR } from '../constant';
import { WinstonLogger } from '../winston/logger';
import { formatLevel } from '../util';
import { MidwayChildLogger } from './child';
import { MidwayContextLogger } from './contextLogger';

const isWindows = os.platform() === 'win32';

export function isPlainObject(value) {
  if (Object.prototype.toString.call(value) !== '[object Object]') {
    return false;
  }

  const prototype = Object.getPrototypeOf(value);
  return prototype === null || prototype === Object.prototype;
}

const midwayLogLevels = {
  none: 0,
  error: 1,
  trace: 2,
  warn: 3,
  info: 4,
  verbose: 5,
  debug: 6,
  silly: 7,
  all: 8,
};

/**
 *  base logger with console transport and file transport
 */
export class MidwayBaseLogger extends WinstonLogger implements IMidwayLogger {
  level: LoggerLevel;
  consoleTransport;
  fileTransport;
  errTransport;
  loggerOptions: LoggerOptions;
  defaultLabel;
  defaultMetadata = {};
  customInfoHandler: LoggerCustomInfoHandler = info => {
    return info;
  };

  constructor(options: LoggerOptions = {}) {
    super(
      Object.assign(options, {
        levels: midwayLogLevels,
      })
    );
    if (isWindows) {
      options.disableErrorSymlink = true;
      options.disableFileSymlink = true;
    }
    this.loggerOptions = options;
    if (this.loggerOptions.defaultLabel) {
      this.defaultLabel = this.loggerOptions.defaultLabel;
    }

    if (this.loggerOptions.defaultMeta) {
      this.defaultMetadata = this.loggerOptions.defaultMeta;
    }

    const loggerFormat = this.loggerOptions.format ?? this.getDefaultFormat();

    this.configure({
      format: loggerFormat,
      exitOnError: false,
    });

    this.consoleTransport = new transports.Console({
      level: formatLevel(options.consoleLevel || options.level || 'silly'),
      format: format.combine(
        process.env.MIDWAY_LOGGER_DISABLE_COLORS !== 'true'
          ? format.colorize({
              all: true,
              colors: {
                none: 'reset',
                error: 'red',
                trace: 'reset',
                warn: 'yellow',
                info: 'reset',
                verbose: 'reset',
                debug: 'blue',
                silly: 'reset',
                all: 'reset',
              },
            })
          : format(i => i)()
      ),
    });

    if (options.disableConsole !== true) {
      this.enableConsole();
    }

    options.dir = options.dir || process.cwd();
    options.fileLogName = options.fileLogName || 'midway-core.log';
    if (isAbsolute(options.fileLogName)) {
      options.dir = dirname(options.fileLogName);
      options.fileLogName = basename(options.fileLogName);
    }
    options.errorLogName = options.errorLogName || 'common-error.log';
    if (isAbsolute(options.errorLogName)) {
      options.errorDir = dirname(options.errorLogName);
      options.errorLogName = basename(options.errorLogName);
    }

    if (options.disableFile !== true) {
      this.enableFile();
    }

    if (options.disableError !== true) {
      this.enableError();
    }
    this.add(new EmptyTransport());
  }

  protected log(level, ...args) {
    const originArgs = [...args];
    let meta, msg;
    if (args.length > 1 && isPlainObject(args[args.length - 1])) {
      meta = args.pop();
    } else {
      meta = {};
    }

    const last = args.pop();
    if (last instanceof Error) {
      msg = util.format(...args, last);
      meta[ORIGIN_ERROR] = last;
    } else {
      msg = util.format(...args, last);
    }

    meta[ORIGIN_ARGS] = originArgs;
    return super.log(level, msg, meta);
  }

  disableConsole(): void {
    this.remove(this.consoleTransport);
  }

  enableConsole(): void {
    this.add(this.consoleTransport);
  }

  disableFile(): void {
    this.remove(this.fileTransport);
  }

  enableFile(): void {
    if (!this.fileTransport) {
      this.fileTransport = new DailyRotateFileTransport({
        dirname: this.loggerOptions.dir,
        filename: this.loggerOptions.fileLogName,
        datePattern: this.loggerOptions.fileDatePattern || 'YYYY-MM-DD',
        level: formatLevel(
          this.loggerOptions.fileLevel || this.loggerOptions.level || 'silly'
        ),
        createSymlink: this.loggerOptions.disableFileSymlink !== true,
        symlinkName: this.loggerOptions.fileLogName,
        maxSize: this.loggerOptions.fileMaxSize || '200m',
        maxFiles: this.loggerOptions.fileMaxFiles || '31d',
        eol: this.loggerOptions.eol || os.EOL,
        zippedArchive: this.loggerOptions.fileZippedArchive,
      });
    }
    this.add(this.fileTransport);
  }

  disableError(): void {
    this.remove(this.errTransport);
  }

  enableError(): void {
    if (!this.errTransport) {
      this.errTransport = new DailyRotateFileTransport({
        dirname: this.loggerOptions.errorDir || this.loggerOptions.dir,
        filename: this.loggerOptions.errorLogName,
        datePattern: this.loggerOptions.errDatePattern || 'YYYY-MM-DD',
        level: 'error',
        createSymlink: this.loggerOptions.disableErrorSymlink !== true,
        symlinkName: this.loggerOptions.errorLogName,
        maxSize: this.loggerOptions.errMaxSize || '200m',
        maxFiles: this.loggerOptions.errMaxFiles || '31d',
        eol: this.loggerOptions.eol || os.EOL,
        zippedArchive: this.loggerOptions.errZippedArchive,
      });
    }
    this.add(this.errTransport);
  }

  isEnableFile(): boolean {
    return !!this.fileTransport;
  }

  isEnableConsole(): boolean {
    return !!this.consoleTransport;
  }

  isEnableError(): boolean {
    return !!this.errTransport;
  }

  getConsoleLevel(): LoggerLevel {
    return this.consoleTransport.level;
  }

  getFileLevel(): LoggerLevel {
    return this.fileTransport.level;
  }

  updateLevel(level: LoggerLevel): void {
    this.level = formatLevel(level);
    this.consoleTransport.level = level;
    this.fileTransport.level = level;
  }

  updateFileLevel(level: LoggerLevel): void {
    this.fileTransport.level = formatLevel(level);
  }

  updateConsoleLevel(level: LoggerLevel): void {
    this.consoleTransport.level = formatLevel(level);
  }

  updateDefaultLabel(defaultLabel: string): void {
    this.defaultLabel = defaultLabel;
  }

  updateDefaultMeta(defaultMetadata: Record<string, unknown>): void {
    this.defaultMetadata = defaultMetadata;
  }

  updateTransformableInfo(customInfoHandler: LoggerCustomInfoHandler): void {
    this.customInfoHandler = customInfoHandler;
  }

  protected getDefaultFormat() {
    const defaultFormat = (info: MidwayTransformableInfo): string => {
      return `${info.timestamp} ${info.LEVEL} ${info.pid} ${info.labelText}${info.message}`;
    };
    return format.combine(
      displayCommonMessage({
        target: this,
      }),
      displayLabels(),
      format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss,SSS',
      }),
      format.splat(),
      format.printf(info => {
        if (info.ignoreFormat) {
          return info.message;
        }
        const newInfo = this.customInfoHandler(info as MidwayTransformableInfo);
        const printInfo =
          newInfo.format ?? this.loggerOptions.printFormat ?? defaultFormat;
        delete newInfo['format'];
        return printInfo(newInfo || (info as MidwayTransformableInfo));
      })
    );
  }

  getDefaultLabel(): string {
    return this.defaultLabel;
  }

  getDefaultMeta(): Record<string, unknown> {
    return this.defaultMetadata;
  }

  write(...args): any {
    if (
      (args.length === 1 && typeof args[0] !== 'object') ||
      !args[0]['level']
    ) {
      // 这里必须要用 none
      return super.log.apply(this, ['trace', ...args, { ignoreFormat: true }]);
    } else {
      return super.write.apply(this, args);
    }
  }

  add(transport): any {
    return super.add(transport);
  }

  remove(transport: any): any {
    return super.remove(transport);
  }

  close(): any {
    return super.close();
  }

  debug(...args) {
    this.log('debug', ...args);
  }
  info(...args) {
    this.log('info', ...args);
  }
  warn(...args) {
    this.log('warn', ...args);
  }
  error(...args) {
    this.log('error', ...args);
  }
  verbose(...args) {
    this.log('verbose', ...args);
  }
  silly(...args) {
    this.log('silly', ...args);
  }

  getLoggerOptions() {
    return this.loggerOptions;
  }

  createChildLogger(options: ChildLoggerOptions = {}) {
    return new MidwayChildLogger(this, {
      ...this.getLoggerOptions(),
      ...options,
    });
  }

  createContextLogger<CTX>(ctx: CTX, options: ContextLoggerOptions = {}) {
    return new MidwayContextLogger(ctx, this, {
      ...this.getLoggerOptions(),
      ...options,
    });
  }
}
