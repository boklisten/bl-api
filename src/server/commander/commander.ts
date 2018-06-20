const program = require('commander');


program
	.option('--log-info', 'Output log from info and up')
	.option('--log-verbose', 'Output log from verbose and up')
	.option('--log-debug', 'Output log from debug and up')
	.option('--log-silly', 'Output log from silly and up')
	.parse(process.argv);


export function getLogLevel() {
	let LOG_LEVEL = 'warn';

	if (program.logInfo) {
		LOG_LEVEL = 'info'
	} else if (program.logVerbose) {
		LOG_LEVEL = 'verbose'
	} else if (program.logDebug) {
		LOG_LEVEL = 'debug'
	} else if (program.logSilly) {
		LOG_LEVEL = 'silly'
	}

	return LOG_LEVEL;
}

