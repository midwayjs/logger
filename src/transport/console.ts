import {
  ConsoleTransportOptions,
  ITransport,
  LoggerLevel,
  LogMeta,
} from '../interface';
import { Transport } from './transport';
import { isEnableLevel } from '../util';
import { Color, colorizeAll, supportsColor } from '../util/color';

const isTerminalSupportColor = supportsColor.stdout;

export class ConsoleTransport
  extends Transport<ConsoleTransportOptions>
  implements ITransport
{
  log(level: LoggerLevel | false, meta: LogMeta, ...args) {
    if (!isEnableLevel(level, this.options.level)) {
      return;
    }
    let msg = this.format(level, meta, args) as string;

    if (
      process.env.FORCE_ENABLE_COLOR ||
      (this.options.autoColors && isTerminalSupportColor)
    ) {
      const color = this.getColor(level);
      msg = colorizeAll(msg, color);
    }

    msg += this.options.eol;
    if (level === 'error') {
      process.stderr.write(msg);
    } else {
      process.stdout.write(msg);
    }
  }

  getColor(level: LoggerLevel | false) {
    switch (level) {
      case 'debug':
        return Color.blue;
      case 'info':
        return Color.green;
      case 'warn':
        return Color.yellow;
      case 'error':
        return Color.red;
      default:
        return Color.white;
    }
  }

  close() {}
}
