import * as winston from 'winston';
import {getLogLevel} from '../server/commander/commander';
import chalk from 'chalk';
import * as moment from 'moment';
const commander = require('commander');

function formatTimestamp(timestamp: string) {
  let date = new Date(timestamp);
  moment(timestamp);
  return moment(timestamp).format('DDMMYYYY-HH:mm:ss.SSS');
}

function colorBasedOnLogLevel(level: string, msg: string): string {
  if (level.indexOf('error') >= 0) {
    return chalk.red(msg);
  } else if (level.indexOf('warn') >= 0) {
    return chalk.yellow(msg);
  } else if (level.indexOf('info') >= 0) {
    return chalk.blue(msg);
  } else if (level.indexOf('verbose') >= 0) {
    return chalk.cyan(msg);
  } else if (level.indexOf('debug') >= 0) {
    return chalk.magenta(msg);
  } else if (level.indexOf('silly') >= 0) {
    return chalk.gray(msg);
  } else {
    return chalk.green(msg);
  }
}

const logFormat = winston.format.printf(info => {
  return colorBasedOnLogLevel(
    info.level,
    `${formatTimestamp(info.timestamp)}} ${info.message}`,
  );
  //turn `${chalk.dim.magenta(formatTimestamp(info.timestamp))} ${info.level} ${chalk.blue('>')} ${info.message}`
});

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
    winston.format.colorize(),
    winston.format.json(),
    winston.format.timestamp(),
    logFormat,
  ),
  transports: [new winston.transports.Console({level: getLogLevel()})],
});
