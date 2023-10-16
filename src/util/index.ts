import { LoggerLevel, LoggerOptions } from '../interface';
import { DefaultLogLevels } from '../constants';
import * as fs from 'fs';
import { dirname, basename } from 'path';
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import * as utc from 'dayjs/plugin/utc';
dayjs.extend(utc);

export function isEnableLevel(
  inputLevel: LoggerLevel | false,
  baseLevel: LoggerLevel
) {
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

const oldOptionsKeys: {
  [key: string]: true;
} = {
  enableConsole: true,
  disableConsole: true,
  enableFile: true,
  enableError: true,
  enableJSON: true,
  disableFile: true,
  disableError: true,
};

export function formatLegacyLoggerOptions(
  unknownLoggerOptions: LoggerOptions
): LoggerOptions {
  // 如果包含任意一个老的配置，则需要转换成新的配置
  if (Object.keys(unknownLoggerOptions).some(key => oldOptionsKeys[key])) {
    const newOptions = { transports: {} } as LoggerOptions;

    for (const key of Object.keys(unknownLoggerOptions)) {
      if (!oldOptionsKeys[key]) {
        // 新值直接覆盖，即使值存在
        newOptions[key] = unknownLoggerOptions[key];
      }
    }
    if (
      newOptions.transports['console'] &&
      (unknownLoggerOptions['enableConsole'] === false ||
        unknownLoggerOptions['disableConsole'] === true)
    ) {
      newOptions.transports['console'] = false;
    }

    if (
      newOptions.transports['file'] &&
      (unknownLoggerOptions['enableFile'] === false ||
        unknownLoggerOptions['disableFile'] === true)
    ) {
      newOptions.transports['file'] = false;
    }

    if (
      newOptions.transports['error'] &&
      (unknownLoggerOptions['enableError'] === false ||
        unknownLoggerOptions['disableError'] === true)
    ) {
      newOptions.transports['error'] = false;
    }

    if (
      newOptions.transports['json'] &&
      unknownLoggerOptions['enableJSON'] === false
    ) {
      newOptions.transports['json'] = false;
    }

    return newOptions;
  }

  return unknownLoggerOptions as LoggerOptions;
}
