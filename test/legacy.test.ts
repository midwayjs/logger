import { formatLegacyLoggerOptions } from '../src/util';
import { FileTransport } from '../src';

describe('/test/legacy.test.ts', () => {
  it('should parse legacy options and ignore new options', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        transports: {
          console: {},
          file: {},
          json: {},
        },
        enableFile: false,
        disableConsole: true,
        enableJSON: true,
      } as any)
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": false,
          "file": false,
        },
      }
    `);
  });

  it('should test json undefined', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        disableFile: true,
      })
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": {},
          "file": false,
          "json": false,
        },
      }
    `);
  });

  it('should test level and file level', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        consoleLevel: 'debug',
        disableFile: true,
      })
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": {
            "level": "debug",
          },
          "file": false,
          "json": false,
        },
      }
    `);
  });

  it('should test console and file format', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        format: info => {
          return 'ok';
        },
        consoleLevel: 'debug',
        dir: '/abc',
        fileLogName: 'test.log',
        errorDir: '/abc/error',
        enableJSON: true,
        jsonLogName: 'test.json',
      })
    ).toMatchInlineSnapshot(`
      {
        "format": [Function],
        "level": "info",
        "transports": {
          "console": {
            "level": "debug",
          },
          "file": {
            "dir": "/abc",
            "fileLogName": "test.log",
          },
          "json": {
            "dir": "/abc",
            "fileLogName": "test.json",
          },
        },
      }
    `);
  });

  it('should test parse error log name', () => {
    expect(
      formatLegacyLoggerOptions({
        dir: '/mock-production-app/logs',
        fileLogName: 'middleware.log',
        auditFileDir: '/mock-production-app/logs/ali-demo/.audit',
        errorDir: '/mock-production-app/logs/ali-demo',
      })
    ).toMatchInlineSnapshot(`
      {
        "transports": {
          "console": {},
          "file": {
            "auditFileDir": "/mock-production-app/logs/ali-demo/.audit",
            "dir": "/mock-production-app/logs",
            "fileLogName": "middleware.log",
          },
          "json": false,
        },
      }
    `);
  });

  it('should test new options', () => {
    const newOptions = formatLegacyLoggerOptions({
      format: info => {
        return `${info.level.toUpperCase()} ${process.pid} ${info.args}`;
      },
      transports: {
        file: new FileTransport({
          dir: __dirname,
          fileLogName: 'test-logger.log',
          createSymlink: false,
        }),
        error: new FileTransport({
          level: 'error',
          dir: __dirname,
          fileLogName: 'test-error.log',
          createSymlink: false,
        }),
      },
    });

    expect(newOptions.transports.file).toBeDefined();
    expect(newOptions.transports.error).toBeDefined();
    expect(newOptions.transports.format).toBeUndefined();
  });

  it('should test legacy options mixin new options', () => {
    const newOptions = formatLegacyLoggerOptions({
      level: 'info',
      dir: 'abc',
      fileLogName: 'test.log',
      errorLogName: 'error.log',
      transports: {
        file: {
          dir: 'def',
          fileLogName: 'test-logger.log',
          createSymlink: false,
        },
      },
    });

    expect(newOptions).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": {},
          "error": {
            "dir": "abc",
            "fileLogName": "error.log",
          },
          "file": {
            "createSymlink": false,
            "dir": "def",
            "fileLogName": "test-logger.log",
          },
          "json": false,
        },
      }
    `);
  });

  it('should test legacy options trans console', () => {
    const newOptions = formatLegacyLoggerOptions({
      dir: '/Users/harry/logs/gaia/function',
      fileLogName: 'function-container.log',
      enableError: false,
      enableFile: false,
      enableConsole: true,
      eol: '\n',
      maxFiles: 3,
      maxSize: '200m',
    });
    console.log(newOptions);
  });

  describe('转换配置', () => {
    it('只存在新配置', () => {
      expect(
        formatLegacyLoggerOptions({
          level: 'all',
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "all",
        }
      `);

      expect(
        formatLegacyLoggerOptions({
          level: 'all',
          transports: {
            file: {
              dir: 'bbc',
              fileLogName: 'custom-logger.log',
            },
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "all",
          "transports": {
            "file": {
              "dir": "bbc",
              "fileLogName": "custom-logger.log",
            },
          },
        }
      `);
    });

    it('新老混合 1', () => {
      expect(
        formatLegacyLoggerOptions({
          level: 'all',
          enableFile: false,
          transports: {
            file: {
              dir: 'bbc',
              fileLogName: 'custom-logger.log',
            },
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "all",
          "transports": {
            "console": {},
            "file": false,
            "json": false,
          },
        }
      `);
    });

    it('新老混合 2', () => {
      // 老配置不会覆盖新配置
      expect(
        formatLegacyLoggerOptions({
          level: 'all',
          fileLogName: 'custom-logger1.log',
          dir: 'bbc',
          transports: {
            file: {
              fileLogName: 'custom-logger.log',
            },
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "all",
          "transports": {
            "console": {},
            "file": {
              "dir": "bbc",
              "fileLogName": "custom-logger.log",
            },
            "json": false,
          },
        }
      `);
    });

    it('新老混合 3', () => {
      // 必须显式声明启用 json
      expect(
        formatLegacyLoggerOptions({
          level: 'all',
          fileLogName: 'custom-logger1.log',
          dir: 'bbc',
          jsonLogName: 'custom-logger.json',
          transports: {
            file: {
              fileLogName: 'custom-logger.log',
            },
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "all",
          "transports": {
            "console": {},
            "file": {
              "dir": "bbc",
              "fileLogName": "custom-logger.log",
            },
            "json": false,
          },
        }
      `);
    });

    it('新老混合 4', () => {
      // 必须显式声明启用 json
      expect(
        formatLegacyLoggerOptions({
          level: 'all',
          fileLogName: 'custom-logger1.log',
          dir: 'bbc',
          jsonLogName: 'custom-logger.json',
          transports: {
            file: {
              fileLogName: 'custom-logger.log',
            },
          },
          enableJSON: true,
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "all",
          "transports": {
            "console": {},
            "file": {
              "dir": "bbc",
              "fileLogName": "custom-logger.log",
            },
            "json": {
              "dir": "bbc",
              "fileLogName": "custom-logger.json",
            },
          },
        }
      `);
    });

    it('新老混合 5', () => {
      // 默认配置
      expect(
        formatLegacyLoggerOptions({
          fileLogName: 'midway-core.log',
          errorLogName: 'common-error.log',
          auditFileDir: '.audit',
          dir: 'abc',
          transports: {
            console: {
              autoColors: true,
            },
            file: {
              bufferWrite: false,
            },
            error: {
              bufferWrite: false,
            },
          },
        })
      ).toMatchInlineSnapshot(`
        {
          "transports": {
            "console": {
              "autoColors": true,
            },
            "error": {
              "auditFileDir": ".audit",
              "bufferWrite": false,
              "dir": "abc",
              "fileLogName": "common-error.log",
            },
            "file": {
              "auditFileDir": ".audit",
              "bufferWrite": false,
              "dir": "abc",
              "fileLogName": "midway-core.log",
            },
            "json": false,
          },
        }
      `);
    });

    it('新老混合 6', () => {
      expect(
        formatLegacyLoggerOptions({
          fileLogName: 'midway-app.log',
          errorLogName: 'common-error.log',
          dir: '/Users/harry/project/application/open-koa-v3/logs/my-midway-project',
          auditFileDir: '.audit',
          transports: {
            console: {
              autoColors: true,
            },
            file: {
              bufferWrite: false,
              dir: '/Users/harry/project/application/open-koa-v3/tmps/logs/WW_ES',
              maxFiles: '90d',
              fileLogName: 'WW_ES.log',
            },
            error: {
              bufferWrite: false,
              dir: '/Users/harry/project/application/open-koa-v3/tmps/logs/WW_ES',
              maxFiles: '90d',
              fileLogName: 'WW_ES-error.log',
            },
          },
          level: 'info',
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "info",
          "transports": {
            "console": {
              "autoColors": true,
            },
            "error": {
              "auditFileDir": ".audit",
              "bufferWrite": false,
              "dir": "/Users/harry/project/application/open-koa-v3/tmps/logs/WW_ES",
              "fileLogName": "WW_ES-error.log",
              "maxFiles": "90d",
            },
            "file": {
              "auditFileDir": ".audit",
              "bufferWrite": false,
              "dir": "/Users/harry/project/application/open-koa-v3/tmps/logs/WW_ES",
              "fileLogName": "WW_ES.log",
              "maxFiles": "90d",
            },
            "json": false,
          },
        }
      `);
    });

    it('新老混合 7', () => {
      expect(
        formatLegacyLoggerOptions({
          fileLogName: 'midway-app.log',
          errorLogName: 'common-error.log',
          maxFiles: '1d',
          errMaxFiles: '90d',
          dir: '/Users/harry/project/application/open-koa-v3/logs/my-midway-project',
          auditFileDir: '.audit',
          level: 'info',
        })
      ).toMatchInlineSnapshot(`
        {
          "level": "info",
          "transports": {
            "console": {},
            "error": {
              "auditFileDir": ".audit",
              "dir": "/Users/harry/project/application/open-koa-v3/logs/my-midway-project",
              "fileLogName": "common-error.log",
              "maxFiles": "90d",
            },
            "file": {
              "auditFileDir": ".audit",
              "dir": "/Users/harry/project/application/open-koa-v3/logs/my-midway-project",
              "fileLogName": "midway-app.log",
              "maxFiles": "1d",
            },
            "json": false,
          },
        }
      `);
    });

    it('新老混合 8', () => {
      const fileTransport = new FileTransport({
        dir: __dirname,
        fileLogName: 'test-logger.log',
      });
      const result = formatLegacyLoggerOptions({
        level: 'warn',
        fileLogName: 'midway-app.log',
        transports: {
          file: fileTransport,
        },
      });

      expect(result.transports.file).toBe(fileTransport);
      delete result['transports']['file'];

      expect(result).toMatchInlineSnapshot(`
        {
          "level": "warn",
          "transports": {
            "console": {},
            "json": false,
          },
        }
      `);
    });

    it('disable and enable console', () => {
      const result = formatLegacyLoggerOptions({
        level: 'warn',
        transports: {
          console: false,
        },
        enableConsole: true,
      });

      expect(result.transports.console).toBe(false);

      const result1 = formatLegacyLoggerOptions({
        level: 'warn',
        transports: {
          console: {},
        },
        enableConsole: true,
      });

      expect(result1.transports.console).toEqual({});

      const result2 = formatLegacyLoggerOptions({
        level: 'warn',
        transports: {
          console: {
            autoColors: true,
          },
        },
        enableConsole: true,
      });

      expect(result2.transports.console).toEqual({
        "autoColors": true
      });
    });
  });
});
