import { ConsoleTransport, FileTransport, MidwayLogger } from '../../src';
import { join } from 'path';
import * as cluster from 'cluster';

if (cluster['isMaster']) {
  console.log(`Master ${process.pid} is running`);
  const pidList = [];

  // Fork workers.
  for (let i = 0; i < 4; i++) {
    const cp = (cluster as any).fork();
    pidList.push(cp.process.pid);
  }
  process.send(pidList);

  (cluster as any).on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  const logger = new MidwayLogger({
    transports: {
      console: new ConsoleTransport(),
      file: new FileTransport({
        dir: join(__dirname, 'logs'),
        fileLogName: 'midway-core.log'
      }),
      error: new FileTransport({
        level: 'error',
        dir: join(__dirname, 'logs'),
        fileLogName: 'common-error.log',
      }),
    }
  });

  setTimeout( () => {
    logger.error(process.pid  + ': output application error');
    logger.error(process.pid  + ': output application error');
    logger.error(process.pid  + ': output application error');
    logger.error(process.pid  + ': output application error');
    logger.close();

    setTimeout( () => {
      process.exit(0);
    }, 100);

  },  1000);
}
