import winston from "winston";
import { getLogLevel } from "../server/commander/commander";
import moment from "moment";
const commander = require("commander");
const colorizer = winston.format.colorize();

function formatTimestamp(timestamp: string) {
  let date = new Date(timestamp);
  return moment(timestamp).format("HH:mm:ss.SSS");
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
