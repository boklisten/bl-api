import * as winston from "winston";
import {getLogLevel} from "../server/commander/commander";
const commander = require('commander');

const logFormat = winston.format.printf(info => {
	return `${info.timestamp} [${info.level}]: ${info.message}`
});

const customLevels = {
	levels: {
		error: 0,
		warn: 1,
		info: 2,
		verbose: 3,
		debug: 4,
		silly: 5
	},
	colors: {
		error: 'red',
		warn: 'yellow',
		info: 'blue',
		verbose: 'cyan',
		debug: 'gray',
		silly: 'magenta'
	}
};

winston.addColors(customLevels.colors);


export const logger = winston.createLogger({
	levels: customLevels.levels,
	format: winston.format.combine(
		winston.format.colorize(),
		winston.format.json(),
		winston.format.timestamp(),
		logFormat
	),
	transports: [
		new  winston.transports.Console({level: getLogLevel()})
	]
});
