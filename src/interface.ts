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
  originError?: Error;
};

export interface TransportUnionOptions {
  /**
   * console transport options
   */
  console?: ConsoleTransportOptions | ITransport | false;
  /**
   * file transport options
   */
  file?: FileTransportOptions | ITransport | false;
  /**
   * error transport options
   */
  error?: FileTransportOptions | ITransport | false;
  /**
   * json transport options
   */
  json?: FileTransportOptions | ITransport | false;
  /**
   * custom transport options
   */
  [key: string]: Record<string, any> | ITransport | false;
}

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
  transports?: TransportUnionOptions;
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
  format?: LoggerFormat;
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

export interface LegacyLoggerOptions {
  /**
   * default level for console,file and json logger
   */
  level?: LoggerLevel;
  /**
   * level for console logger
   * @deprecated
   */
  consoleLevel?: LoggerLevel;
  /**
   * level for file logger
   * @deprecated
   */
  fileLevel?: LoggerLevel;
  /**
   * level for json logger
   * @deprecated
   */
  jsonLevel?: LoggerLevel;
  /**
   * Output format for console and file
   */
  format?: LoggerFormat;
  /**
   * Output format for context logger
   */
  contextFormat?: LoggerFormat;
  /**
   * format for json logger
   * @deprecated
   */
  jsonFormat?: LoggerFormat;
  /**
   * The directory where file logger will be output
   * @deprecated
   */
  dir?: string;
  /**
   * The directory where error logger will be output, if not set, use dir to instead.
   * @deprecated
   */
  errorDir?: string;
  /**
   * The directory where json logger will be output, if not set, use dir to instead.
   * @deprecated
   */
  jsonDir?: string;
  /**
   * Use alias name for current logger, a proxy name
   */
  aliasName?: string;
  /**
   * Output log name for file logger
   * @deprecated
   */
  fileLogName?: string;
  /**
   * Output log name for error logger
   * @deprecated
   */
  errorLogName?: string;
  /**
   * Output log name for json logger
   * @deprecated
   */
  jsonLogName?: string;
  /**
   * Enable console transport, default is true
   * @deprecated
   */
  enableConsole?: boolean;
  /**
   * Enable console transport, default is true
   * @deprecated
   */
  enableFile?: boolean;
  /**
   * Enable console transport, default is true
   * @deprecated
   */
  enableError?: boolean;
  /**
   * Enable json transport, default is false
   * @deprecated
   */
  enableJSON?: boolean;
  /**
   * disable symlink for file, error and json logger
   * @deprecated
   */
  disableSymlink?: boolean;
  /**
   * disable symlink for file logger
   * @deprecated
   */
  disableFileSymlink?: boolean;
  /**
   * disable symlink for error logger
   * @deprecated
   */
  disableErrorSymlink?: boolean;
  /**
   * disable symlink for json logger
   * @deprecated
   */
  disableJSONSymlink?: boolean;
  /**
   * Maximum file size for file, error and json logger
   * Maximum size of the file after which it will rotate.
   * This can be a number of bytes, or units of kb, mb, and gb.
   * If using the units, add 'k', 'm', or 'g' as the suffix.
   * The units need to directly follow the number.
   * default is 200m
   * @deprecated
   */
  maxSize?: string;
  /**
   * max file size for file logger
   * @deprecated
   */
  fileMaxSize?: string;
  /**
   * max file size for error logger
   * @deprecated
   */
  errMaxSize?: string;
  /**
   * max file size for json logger
   * @deprecated
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
   * @deprecated
   */
  maxFiles?: number | string;
  /**
   * max files for file logger
   * @deprecated
   */
  fileMaxFiles?: number | string;
  /**
   * max files for error logger
   * @deprecated
   */
  errMaxFiles?: number | string;
  /**
   * max files for json logger
   * @deprecated
   */
  jsonMaxFiles?: number | string;
  /**
   * end of line string for file and error logger
   */
  eol?: string;
  /**
   * end of line string for json logger
   * @deprecated
   */
  jsonEol?: string;
  /**
   * A boolean to define whether or not to gzip archived log files.
   * for file, error and json logger
   * @deprecated
   */
  zippedArchive?: boolean;
  /**
   * gzip options for file logger
   * @deprecated
   */
  fileZippedArchive?: boolean;
  /**
   * gzip options for error logger
   * @deprecated
   */
  errZippedArchive?: boolean;
  /**
   * gzip options for json logger
   * @deprecated
   */
  jsonZippedArchive?: boolean;
  /**
   * A string representing the moment.js date format to be used for rotating.
   * The meta characters used in this string will dictate the frequency of the file rotation.
   * For example, if your datePattern is simply 'HH' you will end up with 24 log files that are picked up and appended to every day.
   * default: 'YYYY-MM-DD'
   * for file, error and json logger
   * @deprecated
   */
  datePattern?: string;
  /**
   * date pattern for file logger
   * @deprecated
   */
  fileDatePattern?: string;
  /**
   * date pattern for error logger
   * @deprecated
   */
  errDatePattern?: string;
  /**
   * date pattern for json logger
   * @deprecated
   */
  jsonDatePattern?: string;
  /**
   * A directory of the audit file with absolute path.
   * @deprecated
   */
  auditFileDir?: string;
  /**
   * @deprecated use format instead
   */
  printFormat?: LoggerFormat;
  /**
   * @deprecated
   */
  defaultMeta?: object;
  /**
   * @deprecated
   */
  defaultLabel?: string | LoggerFormat;
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
  /**
   * writeable stream options for file logger
   */
  fileOptions?: any;
}

