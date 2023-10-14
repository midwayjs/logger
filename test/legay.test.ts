import { formatLegacyLoggerOptions } from '../src/util';
import { join } from 'path';

describe('/test/legacy.test.ts', () => {
  it('should parse legacy options', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        dir: __dirname,
        fileLogName: 'test.log',
        enableFile: true,
        disableJSONSymlink: true,
        disableConsole: true,
      })
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "error": {
            "dir": "${__dirname}",
            "fileLogName": "test.log",
          },
          "file": {
            "dir": "${__dirname}",
            "fileLogName": "test.log",
          },
          "json": false,
        },
      }
    `);
  });

  it('should parse dir and errorDir', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        dir: __dirname,
        errorDir: join(__dirname, '../error'),
      })
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "error": {
            "dir": "${join(__dirname, '../error')}",
          },
          "file": {
            "dir": "${__dirname}",
          },
          "json": false,
        },
      }
    `);
  });

  it('should test new and old options mixin', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        transports: {
          console: {
            level: 'warn',
            eol: '\n',
          },
        },
        consoleLevel: 'error',
      })
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": {
            "eol": "
      ",
            "level": "warn",
          },
        },
      }
    `);
  });

  it('should test transport disabled and transport mix', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        transports: {
          console: {
            autoColors: true,
          },
        },
        consoleLevel: 'error',
        disableConsole: true,
      })
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": false,
        },
      }
    `);
  });
});
