import {
  ContextLoggerOptions,
  ILogger,
  IMidwayContextLogger,
} from '../interface';

export class MidwayContextLogger<CTX> implements IMidwayContextLogger<CTX> {
  constructor(
    protected readonly ctx: CTX,
    protected readonly appLogger: ILogger,
    protected readonly options: ContextLoggerOptions = {}
  ) {}

  protected log(...args) {
    if (!['debug', 'info', 'warn', 'error'].includes(args[0])) {
      args.unshift('info');
    }
    this.transformLog('log', args);
  }

  public debug(...args) {
    this.transformLog('debug', args);
  }

  public info(...args) {
    this.transformLog('info', args);
  }

  public warn(...args) {
    this.transformLog('warn', args);
  }

  public error(...args) {
    this.transformLog('error', args);
  }

  public getContext(): CTX {
    return this.ctx;
  }

  private transformLog(level, args) {
    return this.appLogger[level].apply(this.appLogger, [
      ...args,
      {
        label: this.formatContextLabel(),
        ctx: this.ctx,
        format: this.options.contextFormat,
      },
    ]);
  }

  protected formatContextLabel() {
    return '';
  }
}
