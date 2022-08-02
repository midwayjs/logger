import { transports, format as winstonFormat } from 'winston';
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
import { displayLabels, displayCommonMessage, customJSON } from '../format';
import * as os from 'os';
import { basename, dirname, isAbsolute, join } from 'path';
import * as util from 'util';
import { ORIGIN_ARGS, ORIGIN_ERROR } from '../constant';
import { WinstonLogger } from '../winston/logger';
import {
  assertConditionTruthy,
  assertEmptyAndThrow,
  formatJsonLogName,
  formatLevel,
} from '../util';
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
  protected level: LoggerLevel;
  private consoleTransport;
  private fileTransport;
  private errTransport;
  private jsonTransport;
  private loggerOptions: LoggerOptions;
  private defaultLabel;
  private defaultMetadata = {};
  private customInfoHandler: LoggerCustomInfoHandler = info => {
    return info;
  };
  private defaultPrintFormat = (info: MidwayTransformableInfo): string => {
    return `${info.timestamp} ${info.LEVEL} ${info.pid} ${info.labelText}${info.message}`;
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

    this.configure({
      format: this.getDefaultFormat(),
      exitOnError: false,
    });

    // add console log transport
    if (options.enableConsole !== false && options.disableConsole !== true) {
      this.enableConsole();
    }

    options.dir = options.dir || process.cwd();
    if (options.auditFileDir && !isAbsolute(options.auditFileDir)) {
      options.auditFileDir = join(options.dir, options.auditFileDir);
    }

    // add file log transport
    if (options.enableFile !== false && options.disableFile !== true) {
      assertEmptyAndThrow(
        options.fileLogName,
        '[logger]: Please set fileLogName when enable file log'
      );
      if (isAbsolute(options.fileLogName)) {
        options.dir = dirname(options.fileLogName);
        options.fileLogName = basename(options.fileLogName);
      }
      this.enableFile();
    }

    // add error log transport
    if (options.enableError !== false && options.disableError !== true) {
      options.errorLogName = options.errorLogName || 'common-error.log';
      if (isAbsolute(options.errorLogName)) {
        options.errorDir = dirname(options.errorLogName);
        options.errorLogName = basename(options.errorLogName);
      }

      this.enableError();
    }

    // add json log transport
    if (options.enableJSON === true) {
      options.jsonLogName =
        options.jsonLogName ?? formatJsonLogName(options.fileLogName);
      assertEmptyAndThrow(
        options.jsonLogName,
        '[logger]: Please set jsonLogName when enable output json'
      );
      this.enableJSON();
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
    if (!this.consoleTransport) {
      let format;
      if (
        process.env.MIDWAY_LOGGER_DISABLE_COLORS !== 'true' ||
        this.loggerOptions.disableConsoleColors
      ) {
        format = this.getDefaultPrint();
      } else {
        format = winstonFormat.combine(
          this.getDefaultPrint(),
          winstonFormat.colorize({
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
        );
      }

      this.consoleTransport = new transports.Console({
        level: formatLevel(
          this.loggerOptions.consoleLevel || this.loggerOptions.level || 'silly'
        ),
        format,
      });
    }
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
        datePattern:
          this.loggerOptions.fileDatePattern ||
          this.loggerOptions.datePattern ||
          'YYYY-MM-DD',
        level: formatLevel(
          this.loggerOptions.fileLevel || this.loggerOptions.level || 'silly'
        ),
        createSymlink: assertConditionTruthy(
          this.loggerOptions.disableFileSymlink,
          this.loggerOptions.disableSymlink
        ),
        symlinkName: this.loggerOptions.fileLogName,
        maxSize:
          this.loggerOptions.fileMaxSize ||
          this.loggerOptions.maxSize ||
          '200m',
        maxFiles:
          this.loggerOptions.fileMaxFiles ||
          this.loggerOptions.maxFiles ||
          '31d',
        eol: this.loggerOptions.eol || os.EOL,
        zippedArchive:
          this.loggerOptions.fileZippedArchive ||
          this.loggerOptions.zippedArchive,
        format: this.getDefaultPrint(),
        auditFileDir: this.loggerOptions.auditFileDir,
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
        datePattern:
          this.loggerOptions.errDatePattern ||
          this.loggerOptions.datePattern ||
          'YYYY-MM-DD',
        level: 'error',
        createSymlink: assertConditionTruthy(
          this.loggerOptions.disableErrorSymlink,
          this.loggerOptions.disableSymlink
        ),
        symlinkName: this.loggerOptions.errorLogName,
        maxSize:
          this.loggerOptions.errMaxSize || this.loggerOptions.maxSize || '200m',
        maxFiles:
          this.loggerOptions.errMaxFiles ||
          this.loggerOptions.maxFiles ||
          '31d',
        eol: this.loggerOptions.eol || os.EOL,
        zippedArchive:
          this.loggerOptions.errZippedArchive ||
          this.loggerOptions.zippedArchive,
        format: this.getDefaultPrint(),
        auditFileDir: this.loggerOptions.auditFileDir,
      });
    }
    this.add(this.errTransport);
  }

  enableJSON(): void {
    if (!this.jsonTransport) {
      this.jsonTransport = new DailyRotateFileTransport({
        format: winstonFormat.combine(
          customJSON({
            jsonFormat: this.loggerOptions.jsonFormat,
          }),
          winstonFormat.json()
        ),
        dirname: this.loggerOptions.jsonDir || this.loggerOptions.dir,
        filename: this.loggerOptions.jsonLogName,
        datePattern:
          this.loggerOptions.jsonDatePattern ||
          this.loggerOptions.datePattern ||
          'YYYY-MM-DD',
        level: formatLevel(
          this.loggerOptions.jsonLevel || this.loggerOptions.level || 'silly'
        ),
        createSymlink: assertConditionTruthy(
          this.loggerOptions.disableJSONSymlink,
          this.loggerOptions.disableSymlink
        ),
        symlinkName: this.loggerOptions.jsonLogName,
        maxSize:
          this.loggerOptions.jsonMaxSize ||
          this.loggerOptions.maxSize ||
          '200m',
        maxFiles:
          this.loggerOptions.jsonMaxFiles ||
          this.loggerOptions.maxFiles ||
          '31d',
        eol: this.loggerOptions.jsonEol || os.EOL,
        zippedArchive:
          this.loggerOptions.jsonZippedArchive ||
          this.loggerOptions.zippedArchive,
        auditFileDir: this.loggerOptions.auditFileDir,
      });
    }
    this.add(this.jsonTransport);
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

  /**
   * @deprecated
   * @param customInfoHandler
   */
  updateTransformableInfo(customInfoHandler: LoggerCustomInfoHandler): void {
    this.customInfoHandler = customInfoHandler;
  }

  protected getDefaultFormat() {
    return winstonFormat.combine(
      winstonFormat.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss,SSS',
      }),
      winstonFormat.splat(),
      displayCommonMessage({
        target: this,
      }),
      displayLabels()
    );
  }

  private getDefaultPrint() {
    return winstonFormat.printf(info => {
      if (info.ignoreFormat) {
        return info.message;
      }
      const newInfo = this.customInfoHandler(info as MidwayTransformableInfo);
      const printInfo =
        newInfo.format ||
        this.loggerOptions.format ||
        this.loggerOptions.printFormat ||
        this.defaultPrintFormat;
      return printInfo(newInfo || (info as MidwayTransformableInfo));
    });
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
