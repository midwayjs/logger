export interface ILogger {
  info(msg: any, ...args: any[]): void;
  debug(msg: any, ...args: any[]): void;
  error(msg: any, ...args: any[]): void;
  warn(msg: any, ...args: any[]): void;
  write(msg: any, ...args: any[]): void;
  verbose(msg: any, ...args: any[]): void;
}

export type LoggerLevel = 'all' | 'verbose' | 'silly' | 'debug' | 'info' | 'warn' | 'error' | 'none';

export type LoggerFormat<ExtraInfoOptions = LoggerInfo> = (info: ExtraInfoOptions, logger?: ILogger) => string | Record<any, any> | Buffer;

export type LoggerInfo = {
  level: string;
  timestamp: number;
  LEVEL: string;
  args: any[];
  originArgs: any[];
  pid: number;
  message: string;
  ctx?: any;
};

export interface LoggerOptions {
  /**
   * default level for console,file and json logger
   */
  level?: LoggerLevel;
  /**
   * Output format for console and file
   */
  format?: LoggerFormat;
  /**
   * Output format for context logger
   */
  contextFormat?: LoggerFormat;
  /**
   * end of line string for file and error logger
   */
  eol?: string;
  /**
   * Output transport
   */
  transports?: Record<string, ITransport | Record<string, any> | false>;
}

export interface ContextLoggerOptions {
  /**
   * Output format for context logger
   */
  contextFormat?: LoggerFormat;
}

export interface ITransport {
  level: LoggerLevel;
  setLoggerOptions(options: LoggerOptions): void;
  log(level: LoggerLevel | false, meta: LogMeta, ...args: any[]): void;
  close(): void;
  format(level: LoggerLevel | false, meta: LogMeta, args: any[]): string | Record<string, any>;
}

export interface BaseTransportOptions {
  /**
   * default level for console,file and json logger
   */
  level?: LoggerLevel;
  /**
   * end of line string for file and error logger
   */
  eol?: string;
  /**
   * Output format for console and file
   */
  format?: LoggerFormat;
  /**
   * Output format for context logger
   */
  contextFormat?: LoggerFormat;
}

export interface LogMeta {
  ctx?: any;
  contextFormat?: LoggerFormat;
}

export interface ConsoleTransportOptions extends BaseTransportOptions {
  autoColors?: boolean;
}

export interface FileTransportOptions extends BaseTransportOptions {
  /**
   * The directory where file logger will be output
   */
  dir?: string;
  /**
   * Output log name for file logger
   */
  fileLogName?: string;
  /**
   * create symlink for file log name
   */
  createSymlink?: boolean;
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
   * Maximum number of logs to keep.
   * This can be a number of files or number of days.
   * If using days, add 'd' as the suffix.
   * It uses auditFile to keep track of the log files in a json format.
   * It won't delete any file not contained in it.
   * It can be a number of files or number of days
   * default is 31d
   */
  maxFiles?: number | string;
  /**
   * end of line string for file and error logger
   */
  eol?: string;
  /**
   * A boolean to define whether or not to gzip archived log files.
   * for file, error and json logger
   */
  zippedArchive?: boolean;
  /**
   * A string representing the moment.js date format to be used for rotating.
   * The meta characters used in this string will dictate the frequency of the file rotation.
   * For example, if your datePattern is simply 'HH' you will end up with 24 log files that are picked up and appended to every day.
   * default: 'YYYY-MM-DD'
   * for file, error and json logger
   */
  datePattern?: string;
  /**
   * A directory of the audit file with absolute path.
   */
  auditFileDir?: string;
  /**
   * Enable write to file when buffer size is greater than buffer size, default is false
   */
  bufferWrite?: boolean;
  /**
   * Buffer flush interval for file logger, default is 1000ms
   */
  bufferFlushInterval?: number;
  /**
   * Max buffer length for file logger, default is 1000
   */
  bufferMaxLength?: number;
}

export interface StreamOptions {
  filename: string;
  frequency?: string;
  size?: string;
  maxFiles?: number | string;
  endStream?: boolean;
  /**
   * File extension to be added at the end of the filename
   */
  extension?: string;
  createSymlink?: boolean;
  dateFormat?: string;
  auditFile?: string;
  symlinkName?: string;
  utc?: boolean;
  fileOptions?: any;
  /**
   * Hash to be used to add to the audit log (md5, sha256)
   */
  auditHashType?: string;
}

export interface LoggerFactoryOptions extends LoggerOptions {}
