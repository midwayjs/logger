// fork from https://github.com/rogerc/file-stream-rotator/blob/master/FileStreamRotator.js v0.5.7

import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import * as EventEmitter from 'events';
import { debuglog, format } from 'util';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import * as assert from 'assert';
import {
  BubbleEvents,
  checkDailyAndTest,
  checkNumAndType,
  createCurrentSymLink,
  debounce,
  mkDirForFile,
  removeFile,
} from '../util';
import { StreamOptions } from '../interface';

const debug = debuglog('midway-logger');
const staticFrequency = ['daily', 'test', 's', 'm', 'h', 'custom'];
const DATE_FORMAT = 'YYYYMMDDHHmm';
dayjs.extend(utc);

export class FileStreamRotator {
  /**
   * Returns frequency metadata
   * @param frequency
   * @returns {*}
   */
  getFrequency(frequency) {
    const f = frequency.toLowerCase().match(/^(\d+)([smh])$/);
    if (f) {
      return checkNumAndType(f[2], parseInt(f[1]));
    }

    const dailyOrTest = checkDailyAndTest(frequency);
    if (dailyOrTest) {
      return dailyOrTest;
    }

    return false;
  }

  /**
   * Returns a number based on the option string
   * @param size
   * @returns {Number}
   */
  parseFileSize(size) {
    if (size && typeof size === 'string') {
      const _s: any = size.toLowerCase().match(/^((?:0\.)?\d+)([kmg])$/);
      if (_s) {
        switch (_s[2]) {
          case 'k':
            return _s[1] * 1024;
          case 'm':
            return _s[1] * 1024 * 1024;
          case 'g':
            return _s[1] * 1024 * 1024 * 1024;
        }
      }
    }
    return null;
  }

  /**
   * Returns date string for a given format / dateFormat
   * @param format
   * @param dateFormat
   * @param {boolean} utc
   * @returns {string}
   */
  getDate(format, dateFormat, utc) {
    dateFormat = dateFormat || DATE_FORMAT;
    const currentMoment = utc ? dayjs.utc() : dayjs().local();
    if (format && staticFrequency.indexOf(format.type) !== -1) {
      switch (format.type) {
        case 's':
          /*eslint-disable-next-line no-case-declarations*/
          const second =
            Math.floor(currentMoment.second() / format.digit) * format.digit;
          return currentMoment.second(second).format(dateFormat);
        case 'm':
          /*eslint-disable-next-line no-case-declarations*/
          const minute =
            Math.floor(currentMoment.minute() / format.digit) * format.digit;
          return currentMoment.minute(minute).format(dateFormat);
        case 'h':
          /*eslint-disable-next-line no-case-declarations*/
          const hour =
            Math.floor(currentMoment.hour() / format.digit) * format.digit;
          return currentMoment.hour(hour).format(dateFormat);
        case 'daily':
        case 'custom':
        case 'test':
          return currentMoment.format(dateFormat);
      }
    }
    return currentMoment.format(dateFormat);
  }

  /**
   * Read audit json object from disk or return new object or null
   * @param maxLogs
   * @param auditFile
   * @param log_file
   * @returns {Object} auditLogSettings
   * @property {Object} auditLogSettings.keep
   * @property {Boolean} auditLogSettings.keep.days
   * @property {Number} auditLogSettings.keep.amount
   * @property {String} auditLogSettings.auditLog
   * @property {Array} auditLogSettings.files
   */
  setAuditLog(maxLogs, auditFile, log_file) {
    let _rtn = null;
    if (maxLogs) {
      const use_days = maxLogs.toString().substr(-1);
      const _num = maxLogs.toString().match(/^(\d+)/);

      if (Number(_num[1]) > 0) {
        const baseLog = path.dirname(log_file.replace(/%DATE%.+/, '_filename'));
        try {
          if (auditFile) {
            const full_path = path.resolve(auditFile);
            _rtn = JSON.parse(
              fs.readFileSync(full_path, { encoding: 'utf-8' })
            );
          } else {
            const full_path = path.resolve(baseLog + '/' + '.audit.json');
            _rtn = JSON.parse(
              fs.readFileSync(full_path, { encoding: 'utf-8' })
            );
          }
        } catch (e) {
          if (e.code !== 'ENOENT') {
            return null;
          }
          _rtn = {
            keep: {
              days: false,
              amount: Number(_num[1]),
            },
            auditLog: auditFile || baseLog + '/' + '.audit.json',
            files: [],
          };
        }

        _rtn.keep = {
          days: use_days === 'd',
          amount: Number(_num[1]),
        };
      }
    }
    return _rtn;
  }

  /**
   * Write audit json object to disk
   * @param {Object} audit
   * @param {Object} audit.keep
   * @param {Boolean} audit.keep.days
   * @param {Number} audit.keep.amount
   * @param {String} audit.auditLog
   * @param {Array} audit.files
   * @param {String} audit.hashType
   */
  writeAuditLog(audit) {
    try {
      mkDirForFile(audit.auditLog);
      fs.writeFileSync(audit.auditLog, JSON.stringify(audit, null, 2));
    } catch (e) {
      debug(
        new Date().toLocaleString(),
        '[FileStreamRotator] Failed to store log audit at:',
        audit.auditLog,
        'Error:',
        e
      );
    }
  }

  /**
   * Write audit json object to disk
   * @param {String} logfile
   * @param {Object} audit
   * @param {Object} audit.keep
   * @param {Boolean} audit.keep.days
   * @param {Number} audit.keep.amount
   * @param {String} audit.auditLog
   * @param {String} audit.hashType
   * @param {Array} audit.files
   * @param {EventEmitter} stream
   */
  addLogToAudit(logfile, audit, stream) {
    if (audit && audit.files) {
      // Based on contribution by @nickbug - https://github.com/nickbug
      const index = audit.files.findIndex(file => {
        return file.name === logfile;
      });
      if (index !== -1) {
        // nothing to do as entry already exists.
        return audit;
      }
      const time = Date.now();
      audit.files.push({
        date: time,
        name: logfile,
        hash: crypto
          .createHash(audit.hashType)
          .update(logfile + 'LOG_FILE' + time)
          .digest('hex'),
      });

      if (audit.keep.days) {
        const oldestDate = dayjs()
          .subtract(audit.keep.amount, 'days')
          .valueOf();
        audit.files = audit.files.filter(file => {
          if (file.date > oldestDate) {
            return true;
          }
          file.hashType = audit.hashType;
          removeFile(file);
          stream.emit('logRemoved', file);
          return false;
        });
      } else {
        const filesToKeep = audit.files.splice(-audit.keep.amount);
        if (audit.files.length > 0) {
          audit.files.filter(file => {
            file.hashType = audit.hashType;
            removeFile(file);
            stream.emit('logRemoved', file);
            return false;
          });
        }
        audit.files = filesToKeep;
      }

      this.writeAuditLog(audit);
    }

    return audit;
  }

  /**
   *
   * @param options
   * @returns {Object} stream
   */
  getStream(options: StreamOptions) {
    let frequencyMetaData = null;
    let curDate = null;

    assert(options.filename, 'options.filename must be supplied');

    if (options.frequency) {
      frequencyMetaData = this.getFrequency(options.frequency);
    }

    const auditLog = this.setAuditLog(
      options.maxFiles,
      options.auditFile,
      options.filename
    );

    if (auditLog != null) {
      auditLog.hashType =
        options.auditHashType !== undefined ? options.auditHashType : 'md5';
    }

    let fileSize = null;
    let fileCount = 0;
    let curSize = 0;
    if (options.size) {
      fileSize = this.parseFileSize(options.size);
    }

    let dateFormat = options.dateFormat || DATE_FORMAT;
    if (frequencyMetaData && frequencyMetaData.type === 'daily') {
      if (!options.dateFormat) {
        dateFormat = 'YYYY-MM-DD';
      }
      if (
        dayjs().format(dateFormat) !==
          dayjs().endOf('day').format(dateFormat) ||
        dayjs().format(dateFormat) === dayjs().add(1, 'day').format(dateFormat)
      ) {
        debug(
          new Date().toLocaleString(),
          '[FileStreamRotator] Changing type to custom as date format changes more often than once a day or not every day'
        );
        frequencyMetaData.type = 'custom';
      }
    }

    if (frequencyMetaData) {
      curDate = options.frequency
        ? this.getDate(frequencyMetaData, dateFormat, options.utc)
        : '';
    }

    options.createSymlink = options.createSymlink || false;
    options.extension = options.extension || '';
    const filename = options.filename;
    let oldFile = null;
    let logfile = filename + (curDate ? '.' + curDate : '');
    if (filename.match(/%DATE%/)) {
      logfile = filename.replace(
        /%DATE%/g,
        curDate ? curDate : this.getDate(null, dateFormat, options.utc)
      );
    }

    if (fileSize) {
      // 下面应该是启动找到已经创建了的文件，做一些预先处理，比如找到最新的那个文件，方便写入
      let lastLogFile = null;
      let t_log = logfile;
      if (
        auditLog &&
        auditLog.files &&
        auditLog.files instanceof Array &&
        auditLog.files.length > 0
      ) {
        const lastEntry = auditLog.files[auditLog.files.length - 1].name;
        if (lastEntry.match(t_log)) {
          const lastCount = lastEntry.match(t_log + '\\.(\\d+)');
          // Thanks for the PR contribution from @andrefarzat - https://github.com/andrefarzat
          if (lastCount) {
            t_log = lastEntry;
            fileCount = lastCount[1];
          }
        }
      }

      if (fileCount === 0 && t_log === logfile) {
        t_log += options.extension;
      }

      // 计数，找到数字最大的那个日志文件
      while (fs.existsSync(t_log)) {
        lastLogFile = t_log;
        fileCount++;
        t_log = logfile + '.' + fileCount + options.extension;
      }
      if (lastLogFile) {
        const lastLogFileStats = fs.statSync(lastLogFile);
        // 看看最新的那个日志有没有超过设置的大小
        if (lastLogFileStats.size < fileSize) {
          // 没有超，把新文件退栈
          t_log = lastLogFile;
          fileCount--;
          curSize = lastLogFileStats.size;
        }
      }
      logfile = t_log;
    } else {
      logfile += options.extension;
    }

    debug(
      new Date().toLocaleString(),
      '[FileStreamRotator] Logging to: ',
      logfile
    );

    // 循环创建目录和文件，类似 mkdirp
    mkDirForFile(logfile);

    const fileOptions = options.fileOptions || { flags: 'a' };
    // 创建文件流
    let rotateStream = fs.createWriteStream(logfile, fileOptions);
    if (
      (curDate &&
        frequencyMetaData &&
        staticFrequency.indexOf(frequencyMetaData.type) > -1) ||
      fileSize > 0
    ) {
      debug(
        new Date().toLocaleString(),
        '[FileStreamRotator] Rotating file: ',
        frequencyMetaData ? frequencyMetaData.type : '',
        fileSize ? 'size: ' + fileSize : ''
      );

      // 这里用了一个事件代理，方便代理的内容做处理
      const stream: any = new EventEmitter();
      stream.auditLog = auditLog;
      stream.filename = options.filename;
      stream.end = (...args) => {
        rotateStream.end(...args);
        resetCurLogSize.clear();
      };
      stream.canWrite = () => {
        return (
          !rotateStream.closed &&
          rotateStream.writable &&
          !rotateStream.destroyed
        );
      };
      BubbleEvents(rotateStream, stream);

      stream.on('new', newLog => {
        // 创建审计的日志，记录最新的日志文件，切割的记录等
        stream.auditLog = this.addLogToAudit(newLog, stream.auditLog, stream);
        // 创建软链
        if (options.createSymlink) {
          createCurrentSymLink(newLog, options.symlinkName);
        }
      });

      // 这里采用 1s 的防抖，避免过于频繁的获取文件大小
      const resetCurLogSize = debounce(() => {
        let isCurLogRemoved = false;
        try {
          const lastLogFileStats = fs.statSync(logfile);
          if (lastLogFileStats.size > curSize) {
            curSize = lastLogFileStats.size;
          }
        } catch (err) {
          isCurLogRemoved = true;
        }
        return isCurLogRemoved;
      }, 1000);

      stream.write = (str, encoding) => {
        const isCurLogRemoved = resetCurLogSize();
        const newDate = frequencyMetaData
          ? this.getDate(frequencyMetaData, dateFormat, options.utc)
          : curDate;
        if (
          isCurLogRemoved ||
          (curDate && newDate !== curDate) ||
          (fileSize && curSize > fileSize)
        ) {
          let newLogfile =
            filename + (curDate && frequencyMetaData ? '.' + newDate : '');
          if (filename.match(/%DATE%/) && curDate) {
            newLogfile = filename.replace(/%DATE%/g, newDate);
          }

          if (fileSize && curSize > fileSize) {
            fileCount++;
            newLogfile += '.' + fileCount + options.extension;
          } else {
            // reset file count
            fileCount = 0;
            newLogfile += options.extension;
          }
          curSize = 0;

          debug(
            new Date().toLocaleString(),
            format(
              '[FileStreamRotator] Changing logs from %s to %s',
              logfile,
              newLogfile
            )
          );
          curDate = newDate;
          oldFile = logfile;
          logfile = newLogfile;
          // Thanks to @mattberther https://github.com/mattberther for raising it again.
          if (options.endStream === true) {
            rotateStream.end();
          } else {
            rotateStream.destroy();
          }

          mkDirForFile(logfile);

          rotateStream = fs.createWriteStream(newLogfile, fileOptions);
          stream.emit('new', newLogfile);
          stream.emit('rotate', oldFile, newLogfile);
          BubbleEvents(rotateStream, stream);
        }
        rotateStream.write(str, encoding);
        // Handle length of double-byte characters
        curSize += Buffer.byteLength(str, encoding);
      };
      process.nextTick(() => {
        stream.emit('new', logfile);
      });
      stream.emit('new', logfile);
      return stream;
    } else {
      debug(
        new Date().toLocaleString(),
        "[FileStreamRotator] File won't be rotated: ",
        options.frequency,
        options.size
      );
      process.nextTick(() => {
        rotateStream.emit('new', logfile);
      });
      return rotateStream;
    }
  }
}

export class FileStreamRotatorManager {
  private static streamPool = new Map();
  private static loggerRef: WeakMap<NonNullable<unknown>, number> =
    new WeakMap();
  public static enabled = true;

  static getStream(options: StreamOptions) {
    let stream;
    if (this.enabled) {
      // 以文件路径作为缓存
      if (!this.streamPool.has(options.filename)) {
        const stream = new FileStreamRotator().getStream(options);
        this.streamPool.set(options.filename, stream);
        this.loggerRef.set(stream, 0);
      }

      stream = this.streamPool.get(options.filename);
      let num = this.loggerRef.get(stream);
      this.loggerRef.set(stream, num++);
    } else {
      stream = new FileStreamRotator().getStream(options);
    }

    return stream;
  }

  static close(stream) {
    if (this.enabled) {
      if (this.loggerRef.has(stream)) {
        let num = this.loggerRef.get(stream);
        num--;
        if (num === 0) {
          // close real stream and clean
          stream.end();
          this.streamPool.delete(stream.filename);
          this.loggerRef.delete(stream);
        } else if (num > 0) {
          // just set num
          this.loggerRef.set(stream, num);
        } else {
          // ignore
        }
      }
    } else {
      stream.end();
    }
  }

  static clear() {
    // clear streamPool
    for (const stream of this.streamPool.values()) {
      stream.end();
      if (this.loggerRef.has(stream)) {
        this.loggerRef.delete(stream);
      }
    }
    this.streamPool.clear();
    this.loggerRef = new WeakMap();
  }
}
