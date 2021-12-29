import winston from "winston";
import { getLogLevel } from "../server/commander/commander";
import moment from "moment";

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

export const logger = winston.createLogger({
  levels: customLevels,
  format: winston.format.combine(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    winston.format.printf((info: any) => {
      const colorizer = winston.format.colorize();
      if (
        process.env.NODE_ENV === "production" ||
        process.env.NODE_ENV === "dev"
      ) {
        return `${info.level} ${info.message}`;
      }
      return colorizer.colorize(
        info.level,
        `${formatTimestamp(info.timestamp)} ${info.level} ${info.message}`
      );
    }),
    winston.format.colorize({
      all: process.env.NODE_ENV === "production" ? false : true,
    })
  ),
  transports: [
    new winston.transports.Console({
      level: getLogLevel() || "info",
      handleExceptions: true,
    }),
  ],
});
