import {
  ITransport,
  FileTransportOptions,
  LoggerLevel,
  StreamOptions,
  LogMeta,
} from '../interface';
import { Transport } from './transport';
import { FileStreamRotatorManager } from './fileStreamRotator';
import * as path from 'path';
import * as zlib from 'zlib';
import * as fs from 'fs';
import {
  getMaxSize,
  isEnableLevel,
  isValidDirName,
  isValidFileName,
} from '../util';
import { hash } from '../util/hash';

export class FileTransport
  extends Transport<FileTransportOptions>
  implements ITransport
{
  protected logStream: any;
  protected bufSize = 0;
  protected buf = [];
  protected timer: NodeJS.Timer;

  constructor(
    protected readonly options: FileTransportOptions = {} as FileTransportOptions
  ) {
    super(options);
    if (this.options.bufferWrite) {
      this.options.bufferMaxLength = this.options.bufferMaxLength || 1000;
      this.options.bufferFlushInterval =
        this.options.bufferFlushInterval || 1000;
      this.timer = this.createInterval();
    }

    if (
      !isValidFileName(this.options.fileLogName) ||
      !isValidDirName(this.options.dir)
    ) {
      throw new Error('Your path or filename contain an invalid character.');
    }

    const defaultStreamOptions = {
      frequency: 'custom',
      dateFormat: 'YYYY-MM-DD',
      endStream: true,
      fileOptions: { flags: 'a' },
      utc: false,
      extension: '',
      createSymlink: true,
      maxFiles: '7d',
      zippedArchive: false,
    } as Omit<StreamOptions, 'filename'>;

    this.logStream = FileStreamRotatorManager.getStream({
      ...defaultStreamOptions,
      filename: path.join(this.options.dir, this.options.fileLogName),
      size: getMaxSize(options.maxSize || '200m'),
      symlinkName: this.options.fileLogName,
      auditFile: path.join(
        options.auditFileDir || this.options.dir,
        '.' + hash(options) + '-audit.json'
      ),
      ...options,
    });

    this.logStream.on('logRemoved', params => {
      if (options.zippedArchive) {
        const gzName = params.name + '.gz';
        if (fs.existsSync(gzName)) {
          try {
            fs.unlinkSync(gzName);
          } catch (_err) {
            // 尝试删除文件时可能会有些报错，比如权限问题，输出到 stderr 中
            console.error(_err);
          }
          return;
        }
      }
    });

    if (options.zippedArchive) {
      this.logStream.on('rotate', oldFile => {
        const oldFileExist = fs.existsSync(oldFile);
        const gzExist = fs.existsSync(oldFile + '.gz');
        if (!oldFileExist || gzExist) {
          return;
        }

        const gzip = zlib.createGzip();
        const inp = fs.createReadStream(oldFile);
        const out = fs.createWriteStream(oldFile + '.gz');
        inp
          .pipe(gzip)
          .pipe(out)
          .on('finish', () => {
            if (fs.existsSync(oldFile)) {
              fs.unlinkSync(oldFile);
            }
          });
      });
    }
  }

  log(level: LoggerLevel, meta: LogMeta, ...args) {
    if (!isEnableLevel(level, this.options.level)) {
      return;
    }
    let buf = this.format(level, meta, args);

    buf += this.options.eol;

    if (this.options.bufferWrite) {
      this.bufSize += buf.length;
      this.buf.push(buf);
      if (this.buf.length > this.options.bufferMaxLength) {
        this.flush();
      }
    } else {
      this.logStream.write(buf);
    }
  }

  /**
   * close stream
   */
  close() {
    if (this.options.bufferWrite) {
      if (this.buf && this.buf.length > 0) {
        this.flush();
      }

      if (this.timer) {
        clearInterval(this.timer);
        this.timer = null;
      }
    }

    if (this.logStream) {
      FileStreamRotatorManager.close(this.logStream);
      // 处理重复调用 close
      this.logStream = null;
    }
  }

  flush() {
    if (this.buf.length > 0 && this.writable) {
      this.logStream.write(this.buf.join(''));
      this.buf = [];
      this.bufSize = 0;
    }
  }

  /**
   * create interval to flush log into file
   */
  createInterval() {
    return setInterval(() => this.flush(), this.options.bufferFlushInterval);
  }

  get writable() {
    return this.logStream && this.logStream.canWrite();
  }
}

export class ErrorTransport extends FileTransport {
  constructor(options: FileTransportOptions) {
    options.level = 'error';
    super(options);
  }
}

export class JSONTransport extends FileTransport {
  log(level: LoggerLevel, meta: LogMeta, ...args) {
    if (!isEnableLevel(level, this.options.level)) {
      return;
    }
    let buf = this.format(level, meta, args);

    if (typeof buf === 'string' || Buffer.isBuffer(buf)) {
      buf = JSON.stringify({
        message: buf.toString(),
      });
    } else {
      buf = JSON.stringify(buf);
    }

    buf += this.options.eol;

    if (this.options.bufferWrite) {
      this.bufSize += buf.length;
      this.buf.push(buf);
      if (this.buf.length > this.options.bufferMaxLength) {
        this.flush();
      }
    } else {
      this.logStream.write(buf);
    }
  }
}
