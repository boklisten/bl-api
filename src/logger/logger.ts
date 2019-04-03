import * as winston from 'winston';
import {getLogLevel} from '../server/commander/commander';
import * as moment from 'moment';
const commander = require('commander');
const colorizer = winston.format.colorize();

function formatTimestamp(timestamp: string) {
  let date = new Date(timestamp);
  return moment(timestamp).format('DDMMYY-HH:mm:ss.SSS');
}

const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    verbose: 3,
    debug: 4,
    silly: 5,
  },
};

//winston.addColors(customLevels.colors);

export const logger = winston.createLogger({
  levels: customLevels.levels,
  format: winston.format.combine(
    winston.format.printf((info: any) => {
      return colorizer.colorize(
        info.level,
        `${
          process.env.NODE_ENV === 'production'
            ? ''
            : formatTimestamp(info.timestamp)
        }{${info.level}} ${info.message}`,
      );
    }),
    winston.format.colorize({all: true}),
  ),
  transports: [
    new winston.transports.Console({
      level: getLogLevel() || 'info',
      handleExceptions: true,
    }),
  ],
});
