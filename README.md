# @midwayjs/logger

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/midwayjs/midway/pulls)

@midwayjs/logger is a log module for midway project.

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



## Create With Transport

Create logger with console and file transports instance.

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

Create console logger.

```typescript
const logger = loggers.createLogger('consoleLogger', {
  transports: {
    console: new ConsoleTransport(),
  }
})
```

Create logger with options mode.

```typescript
const logger = loggers.createLogger('consoleLogger', {
  transports: {
    console: {
      autoColors: true,
    },
    file: {
      dir: '...',
      fileLogName: 'app.log',
    }
  }
})
```



## Logger Output Method

```ts
logger.debug('debug info');
logger.info('启动耗时 %d ms', Date.now() - start);
logger.warn('warning!');
logger.error(new Error('my error'));
logger.write('abcde');
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



## Format and ContextFormat

Add logger format and context format.

```typescript
const logger = loggers.createLogger('logger', {
  // ...
  format: info => {
    return `${info.timestamp} ${info.message}`;
  },
  contextFormat: info => {
    return `${info.timestamp} [${info.ctx.traceId}] ${info.message}`;
  }
});
```

info is a default metadata, include some properties.



## Tranports

The actual behavior of the log output we call the transport.The log library has four built-in default Transports.

* `ConsoleTransport` Output message to stdout and stderr with color.
* `FileTransport` Output message to file and rotate by self.
* `ErrorTransport` Inherit `FileTransport` and only output error message.
* `JSONTransport` Inherit `FileTransport` and output json format.

The above Transports are all registered by default and can be configured by the name when registering.

```typescript
const logger = loggers.createLogger('consoleLogger', {
  transports: {
    console: {/*...options*/},
    file: {/*...options*/},
    error: {/*...options*/},
    json: {/*...options*/},
  }
});
```



## Implement a new Transport

Inherit Transport abstract class and implement `log` and `close` method.

```typescript
import { Transport, ITransport } from '@midwayjs/logger';

export interface CustomTransportOptions {
  // ...
}

export class CustomTransport extends Transport<CustomTransportOptions> implements ITransport {
  log(level: LoggerLevel | false, meta: LogMeta, ...args) {
    // save file or post to remote server
  }
  
  close() {}
}
```

Register class to `TransportManager` before used.

```typescript
import { TransportManager } from '@midwayjs/logger';

TransportManager.set('custom', CustomTransport);
```

And you can configure it in your code.

```typescript
const logger = loggers.createLogger('consoleLogger', {
  transports: {
    custom: {/*...options*/}
  }
});
```




## Default Logger Options

find more options in [interface](https://github.com/midwayjs/logger/blob/main/src/interface.ts).


## License

[MIT]((http://github.com/midwayjs/logger/blob/master/LICENSE))
