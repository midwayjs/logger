import {
  BaseTransportOptions,
  ContextLoggerOptions,
  ILogger,
  ITransport,
  LoggerLevel,
  LoggerOptions,
  LogMeta,
} from './interface';
import { formatLegacyLoggerOptions, isEnableLevel } from './util';
import { EOL } from 'os';
import { Transport } from './transport/transport';
import { ConsoleTransport } from './transport/console';
import { ErrorTransport, FileTransport, JSONTransport } from './transport/file';

export const TransportManager = new Map();

TransportManager.set('console', ConsoleTransport);
TransportManager.set('file', FileTransport);
TransportManager.set('error', ErrorTransport);
TransportManager.set('json', JSONTransport);

export class MidwayLogger implements ILogger {
  private transports: Map<string, ITransport> = new Map();
  private closeHandlers: Array<() => void> = [];
  protected options: LoggerOptions;

  constructor(options: LoggerOptions = {}) {
    options = formatLegacyLoggerOptions(options);
    this.options = options;
    this.options.level = this.options.level || 'silly';
    this.options.eol = this.options.eol || EOL;
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

  add(
    name: string,
    transport: ITransport | Record<string, BaseTransportOptions> | false
  ) {
    if (transport) {
      let transportInstance: ITransport;
      if (!(transport instanceof Transport)) {
        if (!TransportManager.has(name)) {
          throw new Error(`Transport ${name} is not supported`);
        } else {
          transportInstance = new (TransportManager.get(name) as new (
            ...args
          ) => ITransport)(transport);
        }
      } else {
        transportInstance = transport as ITransport;
      }
      transportInstance.setLoggerOptions(this.options);
      this.transports.set(name, transportInstance);
    }
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

  createContextLogger(ctx: any, options: ContextLoggerOptions = {}) {
    return new MidwayContextLogger(ctx, this, options);
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

export class MidwayContextLogger<CTX> implements ILogger {
  constructor(
    protected readonly ctx: CTX,
    protected readonly parentLogger: MidwayLogger,
    protected readonly options: ContextLoggerOptions = {}
  ) {}

  debug(...args) {
    this.transit('debug', ...args);
  }

  info(...args) {
    this.transit('info', ...args);
  }

  warn(...args) {
    this.transit('warn', ...args);
  }

  error(...args) {
    this.transit('error', ...args);
  }

  verbose(...args: any[]): void {
    this.transit('verbose', ...args);
  }

  write(...args: any[]): void {
    this.transit(false, ...args);
  }

  transit(level: LoggerLevel | false, ...args) {
    this.parentLogger.transit(
      level,
      {
        ctx: this.ctx,
        contextFormat: this.options.contextFormat,
      },
      ...args
    );
  }

  public getContext(): CTX {
    return this.ctx;
  }
}
