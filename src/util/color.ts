/**
 * easy ansi color for terminal
 */
import { platform, env } from 'process';
import * as os from 'os';
import * as tty from 'tty';

export const Color = {
  red: str => `\x1B[31m${str}\x1B[39m`,
  green: str => `\x1B[32m${str}\x1B[39m`,
  yellow: str => `\x1B[33m${str}\x1B[39m`,
  blue: str => `\x1B[34m${str}\x1B[39m`,
  magenta: str => `\x1B[35m${str}\x1B[39m`,
  cyan: str => `\x1B[36m${str}\x1B[39m`,
  white: str => `\x1B[37m${str}\x1B[39m`,
  gray: str => `\x1B[90m${str}\x1B[39m`,
  grey: str => `\x1B[90m${str}\x1B[39m`,
  black: str => `\x1B[30m${str}\x1B[39m`,
  bgRed: str => `\x1B[41m${str}\x1B[49m`,
  bgGreen: str => `\x1B[42m${str}\x1B[49m`,
  bgYellow: str => `\x1B[43m${str}\x1B[49m`,
  bgBlue: str => `\x1B[44m${str}\x1B[49m`,
  bgMagenta: str => `\x1B[45m${str}\x1B[49m`,
  bgCyan: str => `\x1B[46m${str}\x1B[49m`,
  bgWhite: str => `\x1B[47m${str}\x1B[49m`,
  bgBlack: str => `\x1B[40m${str}\x1B[49m`,
  bold: str => `\x1B[1m${str}\x1B[22m`,
  dim: str => `\x1B[2m${str}\x1B[22m`,
  italic: str => `\x1B[3m${str}\x1B[23m`,
  underline: str => `\x1B[4m${str}\x1B[24m`,
  inverse: str => `\x1B[7m${str}\x1B[27m`,
  hidden: str => `\x1B[8m${str}\x1B[28m`,
  strikethrough: str => `\x1B[9m${str}\x1B[29m`,
};

export const colorize = (
  str: string,
  color: keyof typeof Color | (typeof Color)[keyof typeof Color]
) => {
  if (typeof color === 'function') {
    return color(str);
  } else {
    return Color[color](str);
  }
};

export const colorizeAll = (
  str: string,
  color: keyof typeof Color | (typeof Color)[keyof typeof Color]
) => {
  return str.replace(/([^\s]+)/g, str => {
    return colorize(str, color);
  });
};

function hasFlag(flag, argv = process.argv) {
  const prefix = flag.startsWith('-') ? '' : flag.length === 1 ? '-' : '--';
  const position = argv.indexOf(prefix + flag);
  const terminatorPosition = argv.indexOf('--');
  return (
    position !== -1 &&
    (terminatorPosition === -1 || position < terminatorPosition)
  );
}

let flagForceColor;
if (
  hasFlag('no-color') ||
  hasFlag('no-colors') ||
  hasFlag('color=false') ||
  hasFlag('color=never')
) {
  flagForceColor = 0;
} else if (
  hasFlag('color') ||
  hasFlag('colors') ||
  hasFlag('color=true') ||
  hasFlag('color=always')
) {
  flagForceColor = 1;
}

function envForceColor() {
  if ('FORCE_COLOR' in env) {
    if (env.FORCE_COLOR === 'true') {
      return 1;
    }

    if (env.FORCE_COLOR === 'false') {
      return 0;
    }

    return env.FORCE_COLOR.length === 0
      ? 1
      : Math.min(Number.parseInt(env.FORCE_COLOR, 10), 3);
  }
}

function translateLevel(level) {
  if (level === 0) {
    return false;
  }

  return {
    level,
    hasBasic: true,
    has256: level >= 2,
    has16m: level >= 3,
  };
}

function _supportsColor(haveStream, options: { streamIsTTY: boolean }) {
  const streamIsTTY = options.streamIsTTY;
  const sniffFlags = true;
  const noFlagForceColor = envForceColor();
  if (noFlagForceColor !== undefined) {
    flagForceColor = noFlagForceColor;
  }

  const forceColor = sniffFlags ? flagForceColor : noFlagForceColor;

  if (forceColor === 0) {
    return 0;
  }

  if (sniffFlags) {
    if (
      hasFlag('color=16m') ||
      hasFlag('color=full') ||
      hasFlag('color=truecolor')
    ) {
      return 3;
    }

    if (hasFlag('color=256')) {
      return 2;
    }
  }

  // Check for Azure DevOps pipelines.
  // Has to be above the `!streamIsTTY` check.
  if ('TF_BUILD' in env && 'AGENT_NAME' in env) {
    return 1;
  }

  if (haveStream && !streamIsTTY && forceColor === undefined) {
    return 0;
  }

  const min = forceColor || 0;

  if (env.TERM === 'dumb') {
    return min;
  }

  if (platform === 'win32') {
    // Windows 10 build 10586 is the first Windows release that supports 256 colors.
    // Windows 10 build 14931 is the first release that supports 16m/TrueColor.
    const osRelease = os.release().split('.');
    if (Number(osRelease[0]) >= 10 && Number(osRelease[2]) >= 10_586) {
      return Number(osRelease[2]) >= 14_931 ? 3 : 2;
    }

    return 1;
  }

  if ('CI' in env) {
    if ('GITHUB_ACTIONS' in env || 'GITEA_ACTIONS' in env) {
      return 3;
    }

    if (
      [
        'TRAVIS',
        'CIRCLECI',
        'APPVEYOR',
        'GITLAB_CI',
        'BUILDKITE',
        'DRONE',
      ].some(sign => sign in env) ||
      env.CI_NAME === 'codeship'
    ) {
      return 1;
    }

    return min;
  }

  if ('TEAMCITY_VERSION' in env) {
    return /^(9\.(0*[1-9]\d*)\.|\d{2,}\.)/.test(env.TEAMCITY_VERSION) ? 1 : 0;
  }

  if (env.COLORTERM === 'truecolor') {
    return 3;
  }

  if (env.TERM === 'xterm-kitty') {
    return 3;
  }

  if ('TERM_PROGRAM' in env) {
    const version = Number.parseInt(
      (env.TERM_PROGRAM_VERSION || '').split('.')[0],
      10
    );

    switch (env.TERM_PROGRAM) {
      case 'iTerm.app': {
        return version >= 3 ? 3 : 2;
      }

      case 'Apple_Terminal': {
        return 2;
      }
      // No default
    }
  }

  if (/-256(color)?$/i.test(env.TERM)) {
    return 2;
  }

  if (
    /^screen|^xterm|^vt100|^vt220|^rxvt|color|ansi|cygwin|linux/i.test(env.TERM)
  ) {
    return 1;
  }

  if ('COLORTERM' in env) {
    return 1;
  }

  return min;
}

function createSupportsColor(options: { isTTY: boolean }) {
  const level = _supportsColor(true, {
    streamIsTTY: options.isTTY,
  });

  return translateLevel(level);
}

// from https://github.com/chalk/supports-color/blob/v9.4.0/index.js
export const supportsColor = {
  stdout: createSupportsColor({ isTTY: tty.isatty(1) }),
  stderr: createSupportsColor({ isTTY: tty.isatty(2) }),
};
