# @midwayjs/logger

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/midwayjs/midway/pulls)

@midwayjs/logger is a log module extended based on winston, which is suitable for log output under a single process, and supports multiple formats and customizations.

## Install

```bash
$ npm install @midwayjs/logger --save
```

## Create Logger

```ts
import { loggers } from '@midwayjs/logger';

const logger = loggers.createLogger('logger', {
  // some logger options
})
```

Create console, file and error Logger.(default logger, include console, file and error 3 transports)

```typescript
const logger = loggers.createLogger('logger', {
  dir: '...',
  fileLogName: 'app.log',
  errorLogName: 'error.log',
})
```

Create console logger(just disable file and error transports)

```typescript
const logger = loggers.createLogger('consoleLogger', {
  enableFile: false,
  enableError: false,
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
  none: 0,
  error: 1,
  trace: 2,
  warn: 3,
  info: 4,
  verbose: 5,
  debug: 6,
  silly: 7,
  all: 8,
}
```

Set level for all transports

```typescript
const logger = loggers.createLogger('logger', {
  dir: '...',
  level: 'warn',
  fileLogName: 'app.log',
  errorLogName: 'error.log',
});

// not output
logger.debug('debug info');

// not output
logger.info('debug info');
```

## Format

Change file and error logger format.

```typescript
const logger = loggers.createLogger('logger', {
  dir: '...',
  level: 'warn',
  fileLogName: 'app.log',
  errorLogName: 'error.log',
  format: info => {
    return `${info.timestamp} ${info.message}`;
  }
});
```

info is a winston metadata we called 'MidwayTransformableInfo' and include some [default value](https://github.com/midwayjs/logger/blob/main/src/interface.ts#L265);


## Logger Options

find more options in [interface](https://github.com/midwayjs/logger/blob/main/src/interface.ts#L70).


## License

[MIT]((http://github.com/midwayjs/logger/blob/master/LICENSE))
