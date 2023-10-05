import {
  ILogger,
  ITransport,
  LoggerLevel,
  LoggerOptions,
  LogMeta,
} from './interface';
import { isEnableLevel } from './util';
import { EOL } from 'os';

export class Logger implements ILogger {
  private transports: Map<string, ITransport> = new Map();
  private closeHandlers: Array<() => void> = [];

  constructor(protected options: LoggerOptions = {}) {
    options.level = options.level || 'silly';
    options.eol = options.eol || EOL;
    if (this.options.transports) {
      for (const name in this.options.transports) {
        this.add(name, this.options.transports[name]);
      }
    }
  }

  get level() {
    return this.options.level;
  }

  set level(level: LoggerLevel) {
    this.options.level = level;
  }

  log(level: LoggerLevel, ...args) {
    this.transit(level, {}, ...args);
  }

  debug(...args) {
    this.transit('debug', {}, ...args);
  }

  info(...args) {
    this.transit('info', {}, ...args);
  }

  warn(...args) {
    this.transit('warn', {}, ...args);
  }

  error(...args) {
    this.transit('error', {}, ...args);
  }

  verbose(...args) {
    this.transit('verbose', {}, ...args);
  }

  write(...args) {
    this.transit(false, {}, ...args);
  }

  silly(...args) {
    this.transit('silly', {}, ...args);
  }

  add(name: string, transport: ITransport) {
    transport.setLoggerOptions(this.options);
    this.transports.set(name, transport);
  }

  get(name: string) {
    return this.transports.get(name);
  }

  remove(
    name: string,
    options: {
      close?: boolean;
    } = {}
  ) {
    if (this.transports.has(name)) {
      if (options.close === undefined || options.close) {
        this.transports.get(name).close();
      }
      this.transports.delete(name);
    }
  }

  close() {
    // close all transports
    for (const name of this.transports.keys()) {
      this.remove(name, {
        close: true,
      });
    }
    for (const closeHandler of this.closeHandlers) {
      closeHandler();
    }
  }

  onClose(closeHandler: () => void) {
    this.closeHandlers.push(closeHandler);
  }

  createContextLogger(ctx: any) {
    return new ContextLogger(ctx, this);
  }

  transit(level: LoggerLevel | false, meta: LogMeta = {}, ...args) {
    // if level is not allowed, ignore
    if (level !== false && !isEnableLevel(level, this.level)) {
      return;
    }

    // transit to transport
    for (const transport of this.transports.values()) {
      transport.log(level, meta, ...args);
    }
  }
}

export class ContextLogger<CTX> implements ILogger {
  constructor(
    protected readonly ctx: CTX,
    protected readonly parentLogger: Logger
  ) {}

  debug(...args) {
    this.parentLogger.transit(
      'debug',
      {
        ctx: this.ctx,
      },
      ...args
    );
  }

  info(...args) {
    this.parentLogger.transit(
      'info',
      {
        ctx: this.ctx,
      },
      ...args
    );
  }

  warn(...args) {
    this.parentLogger.transit(
      'warn',
      {
        ctx: this.ctx,
      },
      ...args
    );
  }

  error(...args) {
    this.parentLogger.transit(
      'error',
      {
        ctx: this.ctx,
      },
      ...args
    );
  }

  verbose(...args: any[]): void {
    this.parentLogger.transit(
      'verbose',
      {
        ctx: this.ctx,
      },
      ...args
    );
  }

  write(...args: any[]): void {
    this.parentLogger.transit(
      false,
      {
        ctx: this.ctx,
      },
      ...args
    );
  }

  public getContext(): CTX {
    return this.ctx;
  }
}
