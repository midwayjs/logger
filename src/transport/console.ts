import { ITransport } from '../interface';

export class ConsoleTransport implements ITransport {
  log(...args) {
    const msg = super.log(level, args, meta);
    if (levels[level] >= this.options.stderrLevel && levels[level] < levels['NONE']) {
      process.stderr.write(msg);
    } else {
      process.stdout.write(msg);
    }
  }
}
