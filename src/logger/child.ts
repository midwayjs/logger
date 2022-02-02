import {
  ChildLoggerOptions,
  IMidwayChildLogger,
  IMidwayLogger,
  LoggerLevel,
} from '../interface';

export class MidwayChildLogger implements IMidwayChildLogger {
  constructor(
    private readonly parentLogger: IMidwayLogger,
    private readonly options: ChildLoggerOptions
  ) {}

  createChildLogger(options: ChildLoggerOptions = {}): IMidwayChildLogger {
    return new MidwayChildLogger(
      this.parentLogger,
      options ?? this.getLoggerOptions()
    );
  }

  getConsoleLevel(): LoggerLevel {
    return this.parentLogger.getConsoleLevel();
  }

  getFileLevel(): LoggerLevel {
    return this.parentLogger.getFileLevel();
  }

  write(...args): boolean {
    return this.parentLogger.write(...args);
  }

  debug(msg: any, ...args: any[]): void {
    this.parentLogger.write(...args);
  }

  error(msg: any, ...args: any[]): void {
    this.parentLogger.write(...args);
  }

  info(msg: any, ...args: any[]): void {
    this.parentLogger.write(...args);
  }

  warn(msg: any, ...args: any[]): void {
    this.parentLogger.write(...args);
  }

  getParentLogger(): IMidwayLogger {
    return this.parentLogger;
  }

  getLoggerOptions(): ChildLoggerOptions {
    return this.options;
  }
}
