import { ITransport } from '../interface';
import { mkdirSync } from 'fs';
import { format } from 'util';

export class FileTransport implements ITransport {
  constructor(options) {
    this._stream = null;
    this.reload();
  }

  get defaults() {
    return utils.assign(super.defaults, {
      file: null,
      level: 'INFO',
    });
  }

  /**
   * reload file stream
   */
  reload() {
    this._closeStream();
    this._stream = this._createStream();
  }

  /**
   * output log, see {@link Transport#log}
   * @param  {String} level - log level
   * @param  {Array} args - all arguments
   * @param  {Object} meta - meta information
   */
  log(level, args, meta) {
    const buf = format(level, args, meta, this.options);
    if (buf.length) {
      this._write(buf);
    }
  }

  /**
   * close stream
   */
  close() {
    this._closeStream();
  }

  /**
   * create stream
   * @return {Stream} return writeStream
   * @private
   */
  _createStream() {
    mkdirSync(path.dirname(this.options.file), { recursive: true });
    const stream = fs.createWriteStream(this.options.file, { flags: 'a' });

    const onError = err => {
      console.error('%s ERROR %s [egg-logger] [%s] %s',
        utility.logDate(','), process.pid, this.options.file, err.stack);
      this.reload();
      console.warn('%s WARN %s [egg-logger] [%s] reloaded', utility.logDate(','), process.pid, this.options.file);
    };
    // only listen error once because stream will reload after error
    stream.once('error', onError);
    stream._onError = onError;
    return stream;
  }

  /**
   * close stream
   * @private
   */
  _closeStream() {
    if (this._stream) {
      this._stream.end();
      this._stream.removeListener('error', this._stream._onError);
      this._stream = null;
    }
  }
}
