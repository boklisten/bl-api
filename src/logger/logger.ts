import moment from "moment";
import { createLogger, format, transports } from "winston";

import { assertEnv, BlEnvironment } from "../config/environment";

function formatTimestamp(timestamp: string) {
  return moment(timestamp).format("HH:mm:ss.SSS");
}

const customLevels = {
  error: 0,
  warn: 1,
  info: 2,
  verbose: 3,
  debug: 4,
  silly: 5,
};

export const logger = createLogger({
  levels: customLevels,
  format: format.combine(
    format.printf((info) => {
      const colorizer = format.colorize();
      const nodeEnv = assertEnv(BlEnvironment.API_ENV);
      if (nodeEnv === "production" || nodeEnv === "dev") {
        return `${info.level} ${info.message}`;
      }
      return colorizer.colorize(
        info.level,
        `${formatTimestamp(info["timestamp"])} ${info.level} ${info.message}`,
      );
    }),
    format.colorize({
      all: assertEnv(BlEnvironment.API_ENV) !== "production",
    }),
  ),
  transports: [
    new transports.Console({
      level: assertEnv(BlEnvironment.LOG_LEVEL),
      handleExceptions: true,
    }),
  ],
});
