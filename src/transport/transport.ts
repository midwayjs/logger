import { format } from 'util';
import {
  BaseTransportOptions,
  ITransport,
  LoggerInfo,
  LoggerLevel,
  LoggerOptions,
  LogMeta,
} from '../interface';
import { getFormatDate } from '../util';
import { LEVEL } from '../constants';

// export abstract class Transport extends Transform {
//   constructor() {
//     super({
//       objectMode: true,
//     });
//   }
//   _transform(
//     chunk: any,
//     encoding: BufferEncoding,
//     callback: TransformCallback
//   ) {
//     const buffer = this.format(chunk);
//     this.push(buffer);
//
//     callback(null, true);
//   }
//
//   abstract format(chunk: any): Buffer;
// }

export abstract class Transport<TransportOptions extends BaseTransportOptions>
  implements ITransport
{
  protected loggerOptions: LoggerOptions;
  protected readonly pid = process.pid;

  constructor(
    protected readonly options: TransportOptions = {} as TransportOptions
  ) {}

  setLoggerOptions(options: LoggerOptions) {
    this.loggerOptions = options;
    this.options.level = this.options.level || options.level;
    this.options.format = this.options.format || options.format;
    this.options.contextFormat =
      this.options.contextFormat || options.contextFormat;
    this.options.eol = this.options.eol || options.eol;
  }

  format(
    level: LoggerLevel | false,
    meta: LogMeta,
    args: any[]
  ): string | Record<string, any> | Buffer {
    const info = this.getLoggerInfo(level, meta, args);
    // support buffer
    if (Buffer.isBuffer(info.args[0])) {
      return info.args[0];
    }

    // for write and ignore format
    if (level === false) {
      return format(info.message);
    }

    // for context logger
    if (meta.ctx) {
      if (meta.contextFormat) {
        return meta.contextFormat(info);
      } else if (this.options.contextFormat) {
        return this.options.contextFormat(info);
      }
    }
    if (this.options.format) {
      return this.options.format(info);
    }

    if (level) {
      return format(
        '%s %s %s %s',
        getFormatDate(info.timestamp, 'YYYY-MM-DD HH:mm:ss.SSS'),
        info.LEVEL,
        info.pid,
        info.message
      );
    } else {
      return format(info.message);
    }
  }

  getLoggerInfo(
    level: LoggerLevel | false,
    meta: LogMeta,
    args: any[]
  ): LoggerInfo {
    const levelString = level || '';
    const info = {
      level: levelString,
      timestamp: Date.now(),
      pid: this.pid,
    };

    Object.defineProperties(info, {
      LEVEL: {
        get() {
          return LEVEL[levelString] || '';
        },
        enumerable: false,
      },
      args: {
        get() {
          return args;
        },
        enumerable: false,
      },
      originArgs: {
        get() {
          return args;
        },
        enumerable: false,
      },
      message: {
        get() {
          return format(...args);
        },
        enumerable: false,
      },
      ctx: {
        get() {
          return meta.ctx;
        },
        enumerable: false,
      },
      originError: {
        get() {
          return args.find(arg => arg instanceof Error);
        },
        enumerable: false,
      },
    });

    return <LoggerInfo>info;
  }

  get level() {
    return this.options.level;
  }

  set level(level: LoggerLevel) {
    this.options.level = level;
  }

  abstract log(level: LoggerLevel | false, meta: LogMeta, ...args: any[]): void;

  abstract close();
}

/**
 * @deprecated
 */
export class EmptyTransport extends Transport<any> {
  log(level: LoggerLevel | false, ...args: any[]) {}

  close() {}
}
