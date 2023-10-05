import { ILogger, LoggerFactoryOptions, LoggerOptions } from './interface';
import { Logger } from './logger';
import * as util from 'util';
const debug = util.debuglog('midway:debug');

export class LoggerFactory extends Map<string, ILogger> {
  private aliasMap = new Map<string, string>();
  constructor(protected factoryOptions: LoggerFactoryOptions = {}) {
    super();
  }

  createLogger(name: string, options: LoggerOptions): ILogger {
    if (!this.has(name)) {
      debug('[logger]: Create logger "%s" with options %j', name, options);
      const logger = new Logger(Object.assign(options, this.factoryOptions));

      if (options.aliasName) {
        this.aliasMap.set(options.aliasName, name);
      }

      this.addLogger(name, logger);
      return logger;
    }

    return this.getLogger(name);
  }

  addLogger(name: string, logger: ILogger, errorWhenReplace = true) {
    if (!errorWhenReplace || !this.has(name)) {
      // 同一个实例就不需要再添加了
      if (this.get(name) !== logger) {
        if (logger['onClose']) {
          logger['onClose'](() => {
            this.delete(name);
          });
        }
        if (logger['on']) {
          (logger as any).on('close', () => this.delete(name));
        }
        this.set(name, logger);
      }
    } else {
      throw new Error(`logger id ${name} has duplicate`);
    }
    return this.get(name);
  }

  getLogger(name: string) {
    return this.get(name);
  }

  removeLogger(name: string) {
    const logger = this.get(name);
    logger?.['close']();
    this.delete(name);
  }

  get(name) {
    return super.get(this.aliasMap.get(name) ?? name);
  }

  /**
   * Closes a `Logger` instance with the specified `name` if it exists.
   * If no `name` is supplied then all Loggers are closed.
   * @param {?string} name - The id of the Logger instance to close.
   * @returns {undefined}
   */
  close(name?: string) {
    if (name) {
      return this.removeLogger(name);
    }

    Array.from(this.keys()).forEach(key => this.removeLogger(key));
  }
}
