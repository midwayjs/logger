import { formatLegacyLoggerOptions } from '../src/util';

describe('/test/legacy.test.ts', () => {
  it('should parse legacy options', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        transports: {
          console: {},
          file: {},
          json: {}
        },
        enableFile: false,
        disableConsole: true,
      } as any)
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": false,
          "file": false,
          "json": {},
        },
      }
    `);
  });

  it('should test json undefined', () => {
    expect(
      formatLegacyLoggerOptions({
        level: 'info',
        transports: {
          console: {},
          file: {},
        },
        disableFile: true,
      } as any)
    ).toMatchInlineSnapshot(`
      {
        "level": "info",
        "transports": {
          "console": {},
          "file": false,
        },
      }
    `);
  });
});
