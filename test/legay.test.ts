import { formatLegacyLoggerOptions } from '../src/util';
import { join } from 'path';

describe('/test/legacy.test.ts', () => {
  it('should parse legacy options', () => {
    expect(formatLegacyLoggerOptions({
      level: 'info',
      dir: __dirname,
      fileLogName: 'test.log',
      enableFile: true,
      disableJSONSymlink: true,
      disableConsole: true,
    })).toMatchSnapshot();
  });

  it('should parse dir and errorDir', () => {
    expect(formatLegacyLoggerOptions({
      level: 'info',
      dir: __dirname,
      errorDir: join(__dirname, '../error'),
    })).toMatchSnapshot();
  });

  it('should test new and old options mixin', () => {
    expect(formatLegacyLoggerOptions({
      level: 'info',
      transports: {
        console: {
          level: 'warn',
          eol: '\n',
        }
      },
      consoleLevel: 'error',
    })).toMatchSnapshot();
  });
});
