import {
  ChildLoggerOptions,
  ContextLoggerOptions,
  IMidwayChildLogger,
  IMidwayLogger,
  LoggerLevel,
} from '../interface';
import { MidwayContextLogger } from './contextLogger';

export class MidwayChildLogger implements IMidwayChildLogger {
  constructor(
    private readonly parentLogger: IMidwayLogger,
    private readonly options: ChildLoggerOptions
  ) {}

  public getConsoleLevel(): LoggerLevel {
    return this.parentLogger.getConsoleLevel();
  }

  public getFileLevel(): LoggerLevel {
    return this.parentLogger.getFileLevel();
  }

  public write(...args): boolean {
    return this.parentLogger.write(...args);
  }

  public debug(...args) {
    this.transformLog('debug', args);
  }

  public info(...args) {
    this.transformLog('info', args);
  }

  public warn(...args) {
    this.transformLog('warn', args);
  }

  public error(...args) {
    this.transformLog('error', args);
  }

  public getParentLogger(): IMidwayLogger {
    return this.parentLogger;
  }

  public getLoggerOptions(): ChildLoggerOptions {
    return this.options;
  }

  public createContextLogger<CTX>(
    ctx: CTX,
    options: ContextLoggerOptions = {}
  ) {
    return new MidwayContextLogger(ctx, this, {
      ...this.getLoggerOptions(),
      ...options,
    });
  }

  private transformLog(level, args) {
    return this.parentLogger[level].apply(this.parentLogger, [
      ...args,
      {
        format: this.options.format,
        jsonFormat: this.options.jsonFormat,
      },
    ]);
  }
}
