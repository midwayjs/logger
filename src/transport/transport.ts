import { Transform, TransformCallback } from 'stream';

export abstract class Transport extends Transform {
  constructor() {
    super({
      objectMode: true,
    });
  }
  _transform(
    chunk: any,
    encoding: BufferEncoding,
    callback: TransformCallback
  ) {
    const buffer = this.format(chunk);
    this.push(buffer);

    callback(null, true);
  }

  abstract format(chunk: any): Buffer;
}
