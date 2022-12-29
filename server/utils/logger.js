const { createLogger, format, transports } = require("winston");
const { combine, timestamp, label, printf } = format;

// Define the custom log format
const logFormat = printf((info) => {
  return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
});

// Create the logger
const logger = createLogger({
  format: combine(label({ label: "app" }), timestamp(), logFormat),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "error.log", level: "error" }),
    new transports.File({ filename: "combined.log" }),
  ],
});

module.exports = logger;
