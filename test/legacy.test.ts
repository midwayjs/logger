import { formatLegacyLoggerOptions } from '../src/util';

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
        "transports": {},
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
        "transports": {},
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
          "error": {
            "dir": "/abc/error",
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

  it('should teest parse error log name', () => {
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
          "error": {
            "auditFileDir": "/mock-production-app/logs/ali-demo/.audit",
            "dir": "/mock-production-app/logs/ali-demo",
          },
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
});
