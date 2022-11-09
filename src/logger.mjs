import winston from 'winston';
import ora, {oraPromise} from 'ora';

const winstonLogger = winston.createLogger({
  transports: [
    new winston.transports.Console(),
  ]
});

export class Logger {
  constructor() {
    this.logger = winstonLogger;
  }

  info(message) {
    this.logger.info(message);
  }

  error(message) {
    this.logger.error(message);
  }

  wait(message, promise) {
    if (promise) return oraPromise(promise, {text: message});

    return ora().start(message);
  }
}