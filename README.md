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

Create logger with console and file transports.

```typescript
import { loggers, ConsoleTransport, FileTransport } from '@midwayjs/logger';

const logger = loggers.createLogger('logger', {
  transports: {
    console: new ConsoleTransport(),
    file: new FileTransport({
      dir: '...',
      fileLogName: 'app.log',
    }),
  }
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
logger.write('abcde);
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
  // ...
  level: 'warn',
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
  // ...
  format: info => {
    return `${info.timestamp} ${info.message}`;
  }
});
```

info is a default metadata, include some properties.


## Logger Options

find more options in [interface](https://github.com/midwayjs/logger/blob/main/src/interface.ts).


## License

[MIT]((http://github.com/midwayjs/logger/blob/master/LICENSE))
