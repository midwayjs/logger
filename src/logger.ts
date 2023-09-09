import { ITransport, LoggerLevel, LoggerOptions } from './interface';
import { isEnableLevel } from './util';

export class Logger {
  private level: LoggerLevel;
  private transports: ITransport[];

  constructor(protected options: LoggerOptions) {
    this.level = options.level || 'silly';
  }

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

  write(...args) {
    this.transit('silly', ...args);
  }

  add(transport: ITransport) {
    this.transports.push(transport);
  }

  remove(transport: ITransport) {
    const index = this.transports.indexOf(transport);
    if (index !== -1) {
      this.transports.splice(index, 1);
    }
  }

  close() {
    // close all transports
    for (const transport of this.transports) {
      transport?.close();
    }
  }

  protected transit(level: LoggerLevel, ...args) {
    // if level is not allowed, ignore
    if (!isEnableLevel(level, this.level)) {
      return;
    }

    // transit to transport
    for (const transport of this.transports) {
      if (isEnableLevel(level, transport?.level)) {
        transport.log[level](...args);
      }
    }
  }
}
