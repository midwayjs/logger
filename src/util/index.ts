import {
  ConsoleTransportOptions,
  FileTransportOptions,
  LegacyLoggerOptions,
  LoggerLevel,
  LoggerOptions
} from '../interface';
import { DefaultLogLevels } from '../constants';
import * as fs from 'fs';
import { dirname, basename } from 'path';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
import { ConsoleTransport } from '../transport/console';
import { FileTransport } from '../transport/file';
dayjs.extend(utc);

export function isEnableLevel(inputLevel: LoggerLevel, baseLevel: LoggerLevel) {
  if (!inputLevel || !baseLevel) {
    return true;
  }
  return DefaultLogLevels[inputLevel] <= DefaultLogLevels[baseLevel];
}

/**
 * Create symbolic link to current log file
 * @param {String} logfile
 * @param {String} name Name to use for symbolic link
 */
export function createCurrentSymLink(logfile, name) {
  const symLinkName = name || 'current.log';
  const logPath = dirname(logfile);
  const logfileName = basename(logfile);
  const current = logPath + '/' + symLinkName;
  try {
    const stats = fs.lstatSync(current);
    if (stats.isSymbolicLink()) {
      fs.unlinkSync(current);
      fs.symlinkSync(logfileName, current);
    }
  } catch (err) {
    if (err && err.code === 'ENOENT') {
      try {
        fs.symlinkSync(logfileName, current);
      } catch (e) {
        console.error(
          new Date().toLocaleString(),
          '[FileStreamRotator] Could not create symlink file: ',
          current,
          ' -> ',
          logfileName
        );
      }
    }
  }
}

/**
 * Removes old log file
 * @param file
 * @param file.hash
 * @param file.name
 * @param file.date
 * @param file.hashType
 */
export function removeFile(file) {
  if (
    file.hash ===
    crypto
      .createHash(file.hashType)
      .update(file.name + 'LOG_FILE' + file.date)
      .digest('hex')
  ) {
    try {
      if (fs.existsSync(file.name)) {
        fs.unlinkSync(file.name);
      }
    } catch (e) {
      console.error(
        new Date().toLocaleString(),
        '[FileStreamRotator] Could not remove old log file: ',
        file.name
      );
    }
  }
}

export function isValidFileName(filename) {
  // eslint-disable-next-line no-control-regex
  return !/["<>|:*?\\/\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f]/g.test(
    filename
  );
}

export function isValidDirName(dirname) {
  // eslint-disable-next-line no-control-regex
  return !/["<>|\x00\x01\x02\x03\x04\x05\x06\x07\x08\x09\x0a\x0b\x0c\x0d\x0e\x0f\x10\x11\x12\x13\x14\x15\x16\x17\x18\x19\x1a\x1b\x1c\x1d\x1e\x1f]/g.test(
    dirname
  );
}

export function getMaxSize(size) {
  if (size && typeof size === 'string') {
    const _s = size.toLowerCase().match(/^((?:0\.)?\d+)([k|m|g])$/);
    if (_s) {
      return size;
    }
  } else if (size && Number.isInteger(size)) {
    const sizeK = Math.round(size / 1024);
    return sizeK === 0 ? '1k' : sizeK + 'k';
  }

  return null;
}

export function throwIf(options, ...args) {
  Array.prototype.slice.call(args, 1).forEach(name => {
    if (options[name]) {
      throw new Error('Cannot set ' + name + ' and ' + args[0] + ' together');
    }
  });
}

export function debounce(func: () => void, wait: number, immediate?) {
  let timeout, args, context, timestamp, result;
  if (null == wait) wait = 100;

  function later() {
    const last = Date.now() - timestamp;

    if (last < wait && last >= 0) {
      timeout = setTimeout(later, wait - last);
    } else {
      timeout = null;
      if (!immediate) {
        result = func.apply(context, args);
        context = args = null;
      }
    }
  }

  const debounced: any = (...args) => {
    // eslint-disable-next-line @typescript-eslint/no-this-alias
    context = this;
    timestamp = Date.now();
    const callNow = immediate && !timeout;
    if (!timeout) timeout = setTimeout(later, wait);
    if (callNow) {
      result = func.apply(context, args);
      context = args = null;
    }

    return result;
  };

  debounced.clear = () => {
    if (timeout) {
      clearTimeout(timeout);
      timeout = null;
    }
  };

  debounced.flush = () => {
    if (timeout) {
      result = func.apply(context, args);
      context = args = null;

      clearTimeout(timeout);
      timeout = null;
    }
  };

  return debounced;
}

export function getFormatDate(
  timestamp: number,
  datePattern: string,
  utc = false
) {
  const date = utc ? dayjs.utc(timestamp) : dayjs(timestamp);
  return date.format(datePattern);
}

export const isDevelopmentEnvironment = env => {
  return ['local', 'test', 'unittest'].includes(env);
};

export function formatLegacyLoggerOptions(
  unknownLoggerOptions: LoggerOptions | LegacyLoggerOptions
): LoggerOptions {
  const newOptionsKeys = [
    'level',
    'format',
    'contextFormat',
    'eol',
    'transports',
  ];
  // 如果是旧的配置，需要转换成新的配置，判断是否有 level, format, contextFormat, eol, transports 之外的属性
  if (
    Object.keys(unknownLoggerOptions).some(key => !newOptionsKeys.includes(key))
  ) {
    const options = unknownLoggerOptions as LegacyLoggerOptions;
    let consoleTransportOptions,
      fileTransportOptions,
      errTransportOptions,
      jsonTransportOptions;

    if (options.enableConsole !== false && options.disableConsole !== true) {
      consoleTransportOptions = {
        level: options.consoleLevel,
      } as ConsoleTransportOptions;
    }

    if (options.enableFile !== false && options.disableFile !== true) {
      fileTransportOptions = {
        level: options.fileLevel,
        dir: options.dir,
        fileLogName: options.fileLogName,
        createSymlink:
          options.disableFileSymlink !== true ?? options.disableSymlink !== true,
        maxSize: options.fileMaxSize ?? options.maxSize,
        maxFiles: options.fileMaxFiles ?? options.maxFiles,
        zippedArchive: options.fileZippedArchive ?? options.zippedArchive,
        datePattern: options.fileDatePattern ?? options.datePattern,
        auditFileDir: options.auditFileDir,
        fileOptions: options.fileOptions,
      } as FileTransportOptions;
    }

    if (options.enableError !== false && options.disableError !== true) {
      errTransportOptions = {
        level: 'error',
        dir: options.errorDir ?? options.dir,
        fileLogName: options.errorLogName,
        createSymlink:
          options.disableErrorSymlink !== true ?? options.disableSymlink !== true,
        maxSize: options.errMaxSize ?? options.maxSize,
        maxFiles: options.errMaxFiles ?? options.maxFiles,
        zippedArchive: options.errZippedArchive ?? options.zippedArchive,
        datePattern: options.errDatePattern ?? options.datePattern,
        auditFileDir: options.auditFileDir,
        fileOptions: options.fileOptions,
      } as FileTransportOptions;
    }

    if (options.enableJSON) {
      jsonTransportOptions = {
        level: options.jsonLevel,
        format: options.jsonFormat,
        dir: options.jsonDir ?? options.dir,
        fileLogName: options.jsonLogName,
        createSymlink:
          options.disableJSONSymlink !== true ?? options.disableSymlink,
        maxSize: options.jsonMaxSize ?? options.maxSize,
        maxFiles: options.jsonMaxFiles ?? options.maxFiles,
        eol: options.jsonEol,
        zippedArchive: options.jsonZippedArchive ?? options.zippedArchive,
        datePattern: options.jsonDatePattern ?? options.datePattern,
        auditFileDir: options.auditFileDir,
        fileOptions: options.fileOptions,
      } as FileTransportOptions;
    }

    return {
      level: options.level ?? 'silly',
      format: options.format,
      contextFormat: options.contextFormat,
      eol: options.eol,
      transports: {
        console:
          consoleTransportOptions &&
          new ConsoleTransport(consoleTransportOptions),
        file: fileTransportOptions && new FileTransport(fileTransportOptions),
        error: errTransportOptions && new FileTransport(errTransportOptions),
        json: jsonTransportOptions && new FileTransport(jsonTransportOptions),
      },
    };
  }

  return unknownLoggerOptions as LoggerOptions;
}
