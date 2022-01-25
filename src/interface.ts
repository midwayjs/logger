import TransportStream = require('winston-transport');

export interface ILogger {
  info(msg: any, ...args: any[]): void;
  debug(msg: any, ...args: any[]): void;
  error(msg: any, ...args: any[]): void;
  warn(msg: any, ...args: any[]): void;
}

export type LoggerCustomInfoHandler = (
  info: MidwayTransformableInfo
) => MidwayTransformableInfo;

export interface IMidwayLogger extends ILogger {
  disableConsole();
  enableConsole();
  disableFile();
  enableFile();
  disableError();
  enableError();
  isEnableFile(): boolean ;
  isEnableConsole(): boolean;
  isEnableError(): boolean ;
  getConsoleLevel(): LoggerLevel;
  getFileLevel(): LoggerLevel;
  updateLevel(level: LoggerLevel): void;
  updateFileLevel(level: LoggerLevel): void;
  updateConsoleLevel(level: LoggerLevel): void;
  updateDefaultLabel(defaultLabel: string): void;
  updateDefaultMeta(defaultMeta: object): void;

  /**
   * @deprecated
   * @param customInfoHandler
   */
  updateTransformableInfo(customInfoHandler: LoggerCustomInfoHandler): void;
  getDefaultLabel(): string;
  getDefaultMeta(): Record<string, unknown>;
  write(...args): boolean;
  add(transport: any): void;
  remove(transport: any): void;
  close(): any;
  createChildLogger(options?: ChildLoggerOptions): IMidwayChildLogger;
  createContextLogger<CTX>(ctx: CTX, options?: ContextLoggerOptions): IMidwayContextLogger<CTX>;
  getLoggerOptions(): LoggerOptions;
}

export interface IMidwayChildLogger extends ILogger, Pick<IMidwayLogger, 'write' | 'getConsoleLevel' | 'getFileLevel' | 'createContextLogger'> {
  getParentLogger(): IMidwayLogger;
  getLoggerOptions(): ChildLoggerOptions;
}

export interface IMidwayContextLogger<CTX> extends ILogger {
  getContext(): CTX;
}

export type LoggerLevel = 'all' | 'silly' | 'debug' | 'info' | 'warn' | 'error' | 'none' | 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE' | 'trace' | 'TRACE';
export type LoggerContextFormat = (info: MidwayTransformableInfo, logger?: IMidwayLogger) => string;
export type JSONLoggerContextFormat = (info: MidwayTransformableInfo, meta: {
  level: string;
  LEVEL: string;
  message: string;
  ctx: any;
  ignoreFormat: boolean;
  originError?: Error;
  stack?: string;
  format?: LoggerContextFormat;
}) => void;

export interface LoggerOptions {
  /**
   * default level for console,file and json logger
   */
  level?: LoggerLevel;
  /**
   * level for console logger
   */
  consoleLevel?: LoggerLevel;
  /**
   * level for file logger
   */
  fileLevel?: LoggerLevel;
  /**
   * level for json logger
   */
  jsonLevel?: LoggerLevel;
  /**
   * Output format for console and file
   */
  format?: LoggerContextFormat;
  /**
   * Output format for context logger
   */
  contextFormat?: LoggerContextFormat;
  /**
   * format for json logger
   */
  jsonFormat?: JSONLoggerContextFormat;
  /**
   * The directory where file logger will be output
   */
  dir?: string;
  /**
   * The directory where error logger will be output, if not set, use dir to instead.
   */
  errorDir?: string;
  /**
   * The directory where json logger will be output, if not set, use dir to instead.
   */
  jsonDir?: string;
  /**
   * Use alias name for current logger, a proxy name
   */
  aliasName?: string;
  /**
   * Output log name for file logger
   */
  fileLogName?: string;
  /**
   * Output log name for error logger
   */
  errorLogName?: string;
  /**
   * Output log name for json logger
   */
  jsonLogName?: string;
  /**
   * Enable console transport, default is true
   */
  enableConsole?: boolean;
  /**
   * Enable console transport, default is true
   */
  enableFile?: boolean;
  /**
   * Enable console transport, default is true
   */
  enableError?: boolean;
  /**
   * Enable json transport, default is false
   */
  enableJSON?: boolean;
  /**
   * disable symlink for file, error and json logger
   */
  disableSymlink?: boolean;
  /**
   * disable symlink for file logger
   */
  disableFileSymlink?: boolean;
  /**
   * disable symlink for error logger
   */
  disableErrorSymlink?: boolean;
  /**
   * disable symlink for json logger
   */
  disableJSONSymlink?: boolean;
  /**
   * Maximum file size for file, error and json logger
   * Maximum size of the file after which it will rotate. This can be a number of bytes, or units of kb, mb, and gb. If using the units, add 'k', 'm', or 'g' as the suffix. The units need to directly follow the number.
   * default is 200m
   */
  maxSize?: string;
  /**
   * max file size for file logger
   */
  fileMaxSize?: string;
  /**
   * max file size for error logger
   */
  errMaxSize?: string;
  /**
   * max file size for json logger
   */
  jsonMaxSize?: string;

  /**
   * Maximum number of logs to keep.  This can be a number of files or number of days. If using days, add 'd' as the suffix. It uses auditFile to keep track of the log files in a json format. It won't delete any file not contained in it. It can be a number of files or number of days
   * default is 31d
   */
  maxFiles?: number | string;
  fileMaxFiles?: number | string;
  errMaxFiles?: number | string;
  jsonMaxFiles?: number | string;
  /**
   * end of line string for file and error logger
   */
  eol?: string;
  /**
   * end of line string for json logger
   */
  jsonEol?: string;
  /**
   * A boolean to define whether or not to gzip archived log files.
   * for file, error and json logger
   */
  zippedArchive?: boolean;
  /**
   * gzip options for file logger
   */
  fileZippedArchive?: boolean;
  /**
   * gzip options for error logger
   */
  errZippedArchive?: boolean;
  /**
   * gzip options for json logger
   */
  jsonZippedArchive?: boolean;

  /**
   * A string representing the moment.js date format to be used for rotating. The meta characters used in this string will dictate the frequency of the file rotation. For example, if your datePattern is simply 'HH' you will end up with 24 log files that are picked up and appended to every day.
   * default: 'YYYY-MM-DD'
   * for file, error and json logger
   */
  datePattern?: string;
  /**
   * date pattern for file logger
   */
  fileDatePattern?: string;
  /**
   * date pattern for error logger
   */
  errDatePattern?: string;
  /**
   * date pattern for json logger
   */
  jsonDatePattern?: string;

  /**
   * @deprecated use format instead
   */
  printFormat?: LoggerContextFormat;
  /**
   * @deprecated
   */
  defaultMeta?: object;
  /**
   * @deprecated
   */
  defaultLabel?: string | LoggerContextFormat;
  /**
   * @deprecated use enableConsole instead
   */
  disableConsole?: boolean;
  /**
   * @deprecated use enableFile instead
   */
  disableFile?: boolean;
  /**
   * @deprecated use enableError instead
   */
  disableError?: boolean;
}

export type ChildLoggerOptions = Pick<LoggerOptions, 'format'| 'jsonFormat'>;

export type ContextLoggerOptions = Pick<LoggerOptions, 'contextFormat' | 'jsonFormat'>;

export interface DelegateLoggerOptions {
  delegateLogger: ILogger;
}

export interface MidwayTransformableInfo {
  [key: string]: any;
  level: string;
  timestamp: string;
  LEVEL: string;
  pid: number;
  labelText: string;
  message: string;
  ctx: any;
  ignoreFormat: boolean;
  defaultLabel: string;
  originError?: Error;
  stack?: string;
  format?: LoggerContextFormat;
}

export interface GeneralDailyRotateFileTransportOptions extends TransportStream.TransportStreamOptions {
  json?: boolean;
  eol?: string;

  /**
   * A string representing the moment.js date format to be used for rotating. The meta characters used in this string will dictate the frequency of the file rotation. For example, if your datePattern is simply 'HH' you will end up with 24 log files that are picked up and appended to every day. (default 'YYYY-MM-DD')
   */
  datePattern?: string;

  /**
   * A boolean to define whether or not to gzip archived log files. (default 'false')
   */
  zippedArchive?: boolean;

  /**
   * Filename to be used to log to. This filename can include the %DATE% placeholder which will include the formatted datePattern at that point in the filename. (default: 'winston.log.%DATE%)
   */
  filename?: string;

  /**
   * The directory name to save log files to. (default: '.')
   */
  dirname?: string;

  /**
   * Write directly to a custom stream and bypass the rotation capabilities. (default: null)
   */
  stream?: NodeJS.WritableStream;

  /**
   * Maximum size of the file after which it will rotate. This can be a number of bytes, or units of kb, mb, and gb. If using the units, add 'k', 'm', or 'g' as the suffix. The units need to directly follow the number. (default: null)
   */
  maxSize?: string | number;

  /**
   * Maximum number of logs to keep. If not set, no logs will be removed. This can be a number of files or number of days. If using days, add 'd' as the suffix. (default: null)
   */
  maxFiles?: string | number;

  /**
   * An object resembling https://nodejs.org/api/fs.html#fs_fs_createwritestream_path_options indicating additional options that should be passed to the file stream. (default: `{ flags: 'a' }`)
   */
  options?: string | object;

  /**
   * A string representing the name of the name of the audit file. (default: './hash-audit.json')
   */
  auditFile?: string;

  /**
   * A string representing the frequency of rotation. (default: 'custom')
   */
  frequency?: string;

  /**
   * A boolean whether or not to generate file name from "datePattern" in UTC format. (default: false)
   */
  utc?: boolean;

  /**
   * A string representing an extension to be added to the filename, if not included in the filename property. (default: '')
   */
  extension?: string;

  /**
   * Create a tailable symlink to the current active log file. (default: false)
   */
  createSymlink?: boolean;

  /**
   * The name of the tailable symlink. (default: 'current.log')
   */
  symlinkName?: string;
}
