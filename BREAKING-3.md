# 3.x 中的 Breaking 变化

## 较大的变化

- 1、移除了 winston 依赖
- 2、简化了 logger format 的过程，提升了性能
- 3、优化了文件写入的性能，增加了 buffer 写入支持
- 4、共享写入同一个文件的文件流


## logger API 变化

### 移除一批 API

移除动态启用的 API

- logger.enableConsole()
- logger.disableConsole()
- logger.disableFile()
- logger.enableFile()
- logger.disableError()
- logger.enableError()
- logger.enableJSON()

移除判断是否开启的 API

- logger.isEnableFile()
- logger.isEnableConsole()
- logger.isEnableError()

移除 level 相关的 API

- logger.getConsoleLevel()
- logger.getFileLevel()
- logger.updateLevel()
- logger.updateFileLevel()
- logger.updateConsoleLevel()

相应的，你可以直接设置 level。

```typscript
logger.level = 'warn';
logger.get('console').level = 'info';
```

移除 label、meta 相关的 API

- logger.updateDefaultLabel()
- logger.updateDefaultMeta()

其他的 API

- logger.createChildLogger()
- logger.getDefaultLabel()
- logger.getDefaultFormat()

## 类型定义的变化

如果在配置中没有了 midwayLogger 的类型提示，你需要在 `src/interface.ts` 中加入日志库的引用。

```ts
// src/interface.ts
import type {} from '@midwayjs/logger';
```


## 配置格式变化

Transport 的配置和 Logger 配置分离，每个 Transport 都可以通过参数独立配置，比如：

```ts
// 旧
new Logger({
  dir: 'xxx',
  fileLogName: 'app.log',
  errorLogName: 'error.log',
})

// 新
new Logger({
  transports: {
    file: {
      dir: '...',
      fileLogName: 'app.log',
    },
    error: {
      dir: '...',
      fileLogName: 'error.log',
    }
  }
})
```

## 配置值变化

文本写入的 Transport（file，error，json） 下

- maxFiles，以前是 31d，现在是 7d


## format 格式

移除了原有的  printFormat，保留 format 和 contextFormat 设计，分别在 Logger 和 ContextLogger 下生效。

```ts
new Logger({
  format: (info) => {
    // ...
  },
  contextFormat: (info) => {
    // ...
  }
})
```

## format info 参数变化

移除字段

- labelText
- stack


新增字段

- args

## Transort

由于不再依赖 winston，不能再使用 winston 的 Transport。

如果有自定义的需要重新实现，比如：

```ts
import { Transport, ITransport, LoggerLevel, LogMeta } from '@midwayjs/logger';


// Transport 的配置
interface CustomOptions {
  // ...
}

class CustomTransport extends Transport<CustomOptions> implements ITransport {
  log(level: LoggerLevel | false, meta: LogMeta, ...args) {
    // 使用内置的格式化方法格式化消息
    let msg = this.format(level, meta, args) as string;
  
    // 异步写入日志库
    remoteSdk.send(msg).catch(err => {
      // 记录下错误或者忽略
      console.error(err);
    });
  }
}
```

## 新老配置转换

日志库提供了一个转换方法，辅助用户将老配置转变为新的配置。

```ts
import { formatLegacyLoggerOptions } from '@midwayjs/logger';

const newLoggerConfig = formatLegacyLoggerOptions({
  level: 'info',
  enableFile: false,
  disableConsole: true,
  enableJSON: true,
});
```

~~注意，这个方法只能转换老的配置，如果配置中同时包含新老配置，则新配置不会有任何变化。~~

当前版本已经可以同时支持新老配置，不需要自行转换了，如可以使用 `formatLegacyLoggerOptions` 方法测试转换后的结果。

转换逻辑如下：

* 1、如果都是新配置，则不做任何处理
* 2、如果配置中包含 `enableXXXX` 或者 `disableXXXX`，则会优先处理，即使存在 transports 的配置
* 3、当新老配置同时存在时，老配置会被忽略，比如 dir 和 transports 中的 dir，则 transports 中的 dir 优先级更高
* 4、转换完成后，如果 transports 中缺少必要的配置，比如 file/error/json 中缺少 dir 和 fileLogName，则会移除这个 Transport
