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
  protected LEVEL: string;

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
    this.LEVEL = this.options.level.toUpperCase();
  }

  format(
    level: LoggerLevel,
    meta: LogMeta,
    args: any[]
  ): string | Record<string, any> | Buffer {
    const info = this.getLoggerInfo(level, meta, args);

    if (meta.ctx && this.options.contextFormat) {
      return this.options.contextFormat(info);
    }
    if (this.options.format) {
      return this.options.format(info);
    }

    if (Buffer.isBuffer(info.args[0])) {
      return info.args[0];
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

  getLoggerInfo(level: LoggerLevel, meta: LogMeta, args: any[]): LoggerInfo {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    const self = this;
    const levelString = level || '';
    const info = {
      level: levelString,
      timestamp: Date.now(),
      pid: process.pid,
    };

    Object.defineProperties(info, {
      LEVEL: {
        get() {
          return self.LEVEL;
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
    });

    return <LoggerInfo>info;
  }

  get level() {
    return this.options.level;
  }

  set level(level: LoggerLevel) {
    this.options.level = level;
    this.LEVEL = level.toUpperCase();
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
