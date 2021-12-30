# midway-logger

[![Package Quality](http://npm.packagequality.com/shield/@midwayjs/logger.svg)](http://packagequality.com/#?package=@midwayjs/logger)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/midwayjs/midway/pulls)


## Create Logger

```ts
import { loggers } from '@midwayjs/logger';

const logger = loggers.createLogger('logger', {
  // some logger options
})
```

## Logger Output Method

```ts
logger.debug('debug info');
logger.info('启动耗时 %d ms', Date.now() - start);
logger.warn('warning!');
logger.error(new Error('my error'));
```

## Logger Level

log level is divided into the following categories, and the log level decreases sequentially (the larger the number, the lower the level):

```ts
const levels = { 
  all: 0,
  error: 1,
  warn: 2,
  info: 3,
  verbose: 4,
  debug: 5,
  silly: 6
}
```

## Logger Options

```ts
export interface LoggerOptions {
  dir?: string;
  fileLogName?: string;
  errorLogName?: string;
  label?: string;
  disableConsole?: boolean;
  disableFile?: boolean;
  disableError?: boolean;
  consoleLevel?: LoggerLevel;
  fileLevel?: LoggerLevel;
  fileMaxSize?: string;
  fileMaxFiles?: string;
  fileDatePattern?: string;
  errMaxSize?: string;
  errMaxFiles?: string;
  errDatePattern?: string;
  disableFileSymlink?: boolean;
  disableErrorSymlink?: boolean;
  printFormat?: (info) => string;
  format?: logform.format;
  eol?: string;
}
```

## License

[MIT]((http://github.com/midwayjs/logger/blob/master/LICENSE))
