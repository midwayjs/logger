import { LegacyLoggerOptions, LoggerLevel, LoggerOptions } from '../interface';
import { DefaultLogLevels } from '../constants';
import * as fs from 'fs';
import { dirname, basename } from 'path';
import * as crypto from 'crypto';
import * as path from 'path';
import * as os from 'os';
import { Transport } from '../transport/transport';

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
 * Returns frequency metadata for minute/hour rotation
 * @param type
 * @param num
 * @returns {*}
 * @private
 */
export function checkNumAndType(type, num) {
  if (typeof num === 'number') {
    switch (type) {
      case 's':
      case 'm':
        if (num < 0 || num > 60) {
          return false;
        }
        break;
      case 'h':
        if (num < 0 || num > 24) {
          return false;
        }
        break;
    }
    return { type: type, digit: num };
  }
}

/**
 * Returns frequency metadata for defined frequency
 * @param freqType
 * @returns {*}
 * @private
 */
export function checkDailyAndTest(freqType) {
  switch (freqType) {
    case 'custom':
    case 'daily':
      return { type: freqType, digit: undefined };
    case 'test':
      return { type: freqType, digit: 0 };
  }
  return false;
}

/**
 * Check and make parent directory
 * @param pathWithFile
 */
export function mkDirForFile(pathWithFile) {
  const _path = path.dirname(pathWithFile);
  _path.split(path.sep).reduce((fullPath, folder) => {
    fullPath += folder + path.sep;
    if (!fs.existsSync(fullPath)) {
      try {
        fs.mkdirSync(fullPath);
      } catch (e) {
        if (e.code !== 'EEXIST') {
          throw e;
        }
      }
    }
    return fullPath;
  }, '');
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

export const isDevelopmentEnvironment = env => {
  return ['local', 'test', 'unittest'].includes(env);
};

const oldEnableOptionsKeys: {
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

/**
 * 仅兼容老的 enableXXX 配置，这部分配置无法对应到新的配置
 * @param unknownLoggerOptions
 */
export function formatLoggerOptions(
  unknownLoggerOptions: LoggerOptions
): LoggerOptions {
  // 如果包含任意一个老的配置，则需要转换成新的配置
  if (
    Object.keys(unknownLoggerOptions).some(key => oldEnableOptionsKeys[key])
  ) {
    const newOptions = { transports: {} } as LoggerOptions;

    for (const key of Object.keys(unknownLoggerOptions)) {
      if (!oldEnableOptionsKeys[key]) {
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

/**
 * 老的配置项映射到新的配置项
 * 格式：key: [transport分类，映射的key，不存在时的默认key]
 */
const legacyOptionsKeys: {
  [key: string]: {
    /**
     * transport分类
     */
    category?:
      | 'console'
      | 'file'
      | 'error'
      | 'json'
      | 'all'
      | 'top'
      | Array<'console' | 'file' | 'error' | 'json'>;
    /**
     * 是否不参与赋值，有些字段在新版本不需要
     */
    ignore?: boolean;
    /**
     * 映射的新 key
     */
    mappingKey?: string;
    /**
     * 值取反
     */
    reverseValue?: boolean;
    /**
     * 如果值存在，是否覆盖（仅限两个老配置之间，比如 maxFiles 和 errMaxFiles）
     */
    overwriteIfExists?: boolean;
    /**
     * 是否是老配置，用于识别是否需要转换
     */
    isOld?: boolean;
  };
} = {
  level: {
    category: 'top',
    mappingKey: 'level',
    isOld: false,
  },
  consoleLevel: {
    category: 'console',
    mappingKey: 'level',
    isOld: true,
  },
  fileLevel: {
    category: 'file',
    mappingKey: 'level',
    isOld: true,
  },
  jsonLevel: {
    category: 'json',
    mappingKey: 'level',
    isOld: true,
  },
  format: {
    category: 'top',
    mappingKey: 'format',
    isOld: false,
  },
  contextFormat: {
    category: 'top',
    mappingKey: 'contextFormat',
    isOld: false,
  },
  jsonFormat: {
    category: 'json',
    mappingKey: 'format',
    isOld: true,
  },
  dir: {
    category: ['file', 'error', 'json'],
    mappingKey: 'dir',
    isOld: true,
  },
  errorDir: {
    category: 'error',
    mappingKey: 'dir',
    overwriteIfExists: true,
    isOld: true,
  },
  jsonDir: {
    category: 'json',
    mappingKey: 'dir',
    overwriteIfExists: true,
    isOld: true,
  },
  aliasName: {
    ignore: true,
    isOld: false,
  },
  fileLogName: {
    category: ['file'],
    mappingKey: 'fileLogName',
    isOld: true,
  },
  errorLogName: {
    category: 'error',
    mappingKey: 'fileLogName',
    overwriteIfExists: true,
    isOld: true,
  },
  jsonLogName: {
    category: 'json',
    mappingKey: 'fileLogName',
    overwriteIfExists: true,
    isOld: true,
  },
  enableConsole: {
    ignore: true,
    isOld: true,
  },
  enableFile: {
    ignore: true,
    isOld: true,
  },
  enableError: {
    ignore: true,
    isOld: true,
  },
  enableJSON: {
    ignore: true,
    isOld: true,
  },
  disableSymlink: {
    category: ['file', 'error', 'json'],
    mappingKey: 'createSymlink',
    isOld: true,
  },
  disableFileSymlink: {
    category: 'file',
    mappingKey: 'createSymlink',
    reverseValue: true,
    overwriteIfExists: true,
    isOld: true,
  },
  disableErrorSymlink: {
    category: 'error',
    mappingKey: 'createSymlink',
    reverseValue: true,
    overwriteIfExists: true,
    isOld: true,
  },
  disableJSONSymlink: {
    category: 'json',
    mappingKey: 'createSymlink',
    reverseValue: true,
    overwriteIfExists: true,
    isOld: true,
  },
  maxSize: {
    category: ['file', 'error', 'json'],
    mappingKey: 'maxSize',
    isOld: true,
  },
  fileMaxSize: {
    category: 'file',
    mappingKey: 'maxSize',
    overwriteIfExists: true,
    isOld: true,
  },
  errMaxSize: {
    category: 'error',
    mappingKey: 'maxSize',
    overwriteIfExists: true,
    isOld: true,
  },
  jsonMaxSize: {
    category: 'json',
    mappingKey: 'maxSize',
    overwriteIfExists: true,
    isOld: true,
  },
  maxFiles: {
    category: ['file', 'error', 'json'],
    mappingKey: 'maxFiles',
    isOld: true,
  },
  fileMaxFiles: {
    category: 'file',
    mappingKey: 'maxFiles',
    overwriteIfExists: true,
    isOld: true,
  },
  errMaxFiles: {
    category: 'error',
    mappingKey: 'maxFiles',
    overwriteIfExists: true,
    isOld: true,
  },
  jsonMaxFiles: {
    category: 'json',
    mappingKey: 'maxFiles',
    overwriteIfExists: true,
    isOld: true,
  },
  eol: {
    category: 'top',
    mappingKey: 'eol',
    isOld: false,
  },
  jsonEol: {
    category: 'json',
    mappingKey: 'eol',
    isOld: true,
  },
  zippedArchive: {
    category: ['file', 'error', 'json'],
    mappingKey: 'zippedArchive',
    isOld: true,
  },
  fileZippedArchive: {
    category: 'file',
    mappingKey: 'zippedArchive',
    overwriteIfExists: true,
    isOld: true,
  },
  errZippedArchive: {
    category: 'error',
    mappingKey: 'zippedArchive',
    overwriteIfExists: true,
    isOld: true,
  },
  jsonZippedArchive: {
    category: 'json',
    mappingKey: 'zippedArchive',
    overwriteIfExists: true,
    isOld: true,
  },
  datePattern: {
    category: ['file', 'error', 'json'],
    mappingKey: 'datePattern',
    isOld: true,
  },
  fileDatePattern: {
    category: 'file',
    mappingKey: 'datePattern',
    overwriteIfExists: true,
    isOld: true,
  },
  errDatePattern: {
    category: 'error',
    mappingKey: 'datePattern',
    overwriteIfExists: true,
    isOld: true,
  },
  jsonDatePattern: {
    category: 'json',
    mappingKey: 'datePattern',
    overwriteIfExists: true,
    isOld: true,
  },
  auditFileDir: {
    category: ['file', 'error', 'json'],
    mappingKey: 'auditFileDir',
    isOld: true,
  },
  printFormat: {
    category: 'top',
    mappingKey: 'format',
    isOld: true,
  },
  defaultMeta: {
    ignore: true,
    isOld: true,
  },
  defaultLabel: {
    ignore: true,
    isOld: true,
  },
  disableConsole: {
    ignore: true,
    isOld: true,
  },
  disableFile: {
    ignore: true,
    isOld: true,
  },
  disableError: {
    ignore: true,
    isOld: true,
  },
  fileOptions: {
    category: ['file', 'error', 'json'],
    mappingKey: 'fileOptions',
    isOld: true,
  },
};

const hasOwn = Object.prototype.hasOwnProperty;
const toStr = Object.prototype.toString;

/**
 * 转换老的配置项到新的配置
 * @param unknownLoggerOptions
 */
export function formatLegacyLoggerOptions(
  unknownLoggerOptions: LoggerOptions & LegacyLoggerOptions
): LoggerOptions {
  function isPlainObject(obj) {
    if (!obj || toStr.call(obj) !== '[object Object]') {
      return false;
    }

    const hasOwnConstructor = hasOwn.call(obj, 'constructor');
    const hasIsPrototypeOf =
      obj.constructor &&
      obj.constructor.prototype &&
      hasOwn.call(obj.constructor.prototype, 'isPrototypeOf');
    // Not own constructor property must be Object
    if (obj.constructor && !hasOwnConstructor && !hasIsPrototypeOf) {
      return false;
    }

    // Own properties are enumerated firstly, so to speed up,
    // if last one is own, then all properties are own.
    let key;
    for (key in obj) {
      /**/
    }

    return typeof key === 'undefined' || hasOwn.call(obj, key);
  }

  function deepMerge(target, source) {
    if (!target) {
      return source;
    }
    if (source && !isPlainObject(source)) {
      return source;
    }
    for (const key of Object.keys(source)) {
      if (source[key] instanceof Object) {
        Object.assign(source[key], deepMerge(target[key], source[key]));
      }
    }

    Object.assign(target || {}, source);
    return target;
  }
  function setTransportOptions(
    newOptions: any,
    optionsKey: string,
    category: string,
    overwriteIfExists = false
  ) {
    if (!newOptions.transports[category]) {
      newOptions.transports[category] = {};
    }
    const key = legacyOptionsKeys[optionsKey].mappingKey ?? optionsKey;
    // 启用了对应的 transport，才进行赋值，但是如果 transport 已经有值了，就不覆盖
    if (overwriteIfExists) {
      newOptions.transports[category][key] = unknownLoggerOptions[optionsKey];
    } else {
      newOptions.transports[category][key] =
        newOptions.transports[category][key] ??
        unknownLoggerOptions[optionsKey];
    }
  }

  function isValidTransport(obj) {
    return (
      obj &&
      (obj instanceof Transport ||
        (typeof obj === 'object' && obj['dir'] && obj['fileLogName']))
    );
  }

  // 如果包含任意一个老的配置，则需要转换成新的配置
  if (
    Object.keys(unknownLoggerOptions).some(key => legacyOptionsKeys[key]?.isOld)
  ) {
    const newOptions = { transports: {} } as LoggerOptions;
    // 循环每个字段，如果是新的配置，直接赋值，如果是旧的配置，需要转换成新的配置
    for (const key of Object.keys(unknownLoggerOptions)) {
      // 设置值到 transport 的 options 上

      if (!legacyOptionsKeys[key]) {
        // 如果值不在 legacyOptionsKeys 中，直接忽略
        continue;
      } else {
        if (legacyOptionsKeys[key].ignore) {
          continue;
        }

        legacyOptionsKeys[key].category = [].concat(
          legacyOptionsKeys[key].category
        );

        for (const category of legacyOptionsKeys[key].category) {
          if (category === 'all') {
            // 赋值到所有启用的 transport
            for (const categoryKey of Object.keys(newOptions.transports)) {
              setTransportOptions(
                newOptions,
                key,
                categoryKey,
                legacyOptionsKeys[key].overwriteIfExists
              );
            }
          } else if (category === 'top') {
            // 赋值到顶层
            newOptions[key] =
              newOptions[key] ??
              unknownLoggerOptions[legacyOptionsKeys[key].mappingKey];
          } else {
            setTransportOptions(
              newOptions,
              key,
              category,
              legacyOptionsKeys[key].overwriteIfExists
            );
          }
        }
      }
    }

    // 如果有新配置的值，那么先拿新配置赋值一遍，避免新配置将老配置合并的时候覆盖
    for (const key of Object.keys(unknownLoggerOptions)) {
      if (!legacyOptionsKeys[key]) {
        deepMerge(newOptions[key], unknownLoggerOptions[key]);
      }
    }

    if (
      unknownLoggerOptions['enableConsole'] === false ||
      unknownLoggerOptions['disableConsole'] === true
    ) {
      newOptions.transports['console'] = false;
    } else {
      newOptions.transports['console'] = newOptions.transports['console'] ?? {};
    }

    if (
      unknownLoggerOptions['enableFile'] === false ||
      unknownLoggerOptions['disableFile'] === true
    ) {
      newOptions.transports['file'] = false;
    } else {
      newOptions.transports['file'] = newOptions.transports['file'] ?? {};
    }

    if (
      unknownLoggerOptions['enableError'] === false ||
      unknownLoggerOptions['disableError'] === true
    ) {
      newOptions.transports['error'] = false;
    } else {
      newOptions.transports['error'] = newOptions.transports['error'] ?? {};
    }

    if (
      unknownLoggerOptions?.transports?.['json'] === undefined &&
      (unknownLoggerOptions['enableJSON'] === undefined ||
        unknownLoggerOptions['enableJSON'] === false)
    ) {
      newOptions.transports['json'] = false;
    } else {
      // 老版本 json 没有默认值
    }

    // 清理不合法的配置
    for (const key of ['file', 'error', 'json']) {
      if (newOptions?.transports?.[key]) {
        if (!isValidTransport(newOptions.transports[key])) {
          delete newOptions.transports[key];
        }
      }
    }

    return newOptions;
  }

  return unknownLoggerOptions as LoggerOptions;
}

/**
 * Bubbles events to the proxy
 * @param emitter
 * @param proxy
 * @constructor
 */
export function BubbleEvents(emitter, proxy) {
  emitter.on('close', () => {
    proxy.emit('close');
  });
  emitter.on('finish', () => {
    proxy.emit('finish');
  });
  emitter.on('error', err => {
    proxy.emit('error', err);
  });
  emitter.on('open', fd => {
    proxy.emit('open', fd);
  });
}

export function isWin32() {
  return os.platform() === 'win32';
}

/**
 * 不使用 dayjs 实现格式化，因为 dayjs 会有性能问题
 * 生成 YYYY-MM-DD HH:mm:ss.SSS 格式的时间
 * @param date
 */
export function getFormatDate(date: Date) {
  function pad(num, size = 2) {
    const s = num + '';
    return s.padStart(size, '0');
  }

  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();

  const hour = date.getHours();
  const minute = date.getMinutes();
  const second = date.getSeconds();
  const millisecond = date.getMilliseconds();

  return `${year}-${pad(month)}-${pad(day)} ${pad(hour)}:${pad(minute)}:${pad(
    second
  )}.${pad(millisecond, 3)}`;
}
