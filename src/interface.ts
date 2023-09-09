export interface ILogger {
  info(msg: any, ...args: any[]): void;
  debug(msg: any, ...args: any[]): void;
  error(msg: any, ...args: any[]): void;
  warn(msg: any, ...args: any[]): void;
}

export type LoggerLevel = 'all' | 'silly' | 'debug' | 'info' | 'warn' | 'error' | 'none' | 'ALL' | 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'NONE' | 'trace' | 'TRACE';

export type LoggerContextFormat = (info: MidwayTransformableInfo, logger?: ILogger) => string;
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
   * Maximum size of the file after which it will rotate.
   * This can be a number of bytes, or units of kb, mb, and gb.
   * If using the units, add 'k', 'm', or 'g' as the suffix.
   * The units need to directly follow the number.
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
   * Maximum number of logs to keep.
   * This can be a number of files or number of days.
   * If using days, add 'd' as the suffix.
   * It uses auditFile to keep track of the log files in a json format.
   * It won't delete any file not contained in it.
   * It can be a number of files or number of days
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
   * A string representing the moment.js date format to be used for rotating.
   * The meta characters used in this string will dictate the frequency of the file rotation.
   * For example, if your datePattern is simply 'HH' you will end up with 24 log files that are picked up and appended to every day.
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
   * A directory of the audit file with absolute path.
   */
  auditFileDir?: string;

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

export interface ITransport {
  level?: LoggerLevel;
  log(info, callback);
  close?();
}
