import moment from "moment";
import { createLogger, format, transports } from "winston";

import { getLogLevel } from "../server/commander/commander";

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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    format.printf((info: any) => {
      const colorizer = format.colorize();
      if (
        process.env["NODE_ENV"] === "production" ||
        process.env["NODE_ENV"] === "dev"
      ) {
        return `${info.level} ${info.message}`;
      }
      return colorizer.colorize(
        info.level,
        `${formatTimestamp(info.timestamp)} ${info.level} ${info.message}`,
      );
    }),
    format.colorize({
      all: process.env["NODE_ENV"] !== "production",
    }),
  ),
  transports: [
    new transports.Console({
      level: getLogLevel() || "info",
      handleExceptions: true,
    }),
  ],
});
