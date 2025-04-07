const winston = require('winston');
const path = require('path');
const fs = require('fs');

const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function createLogger(module) {
  return winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    format: winston.format.combine(
      winston.format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      winston.format.errors({ stack: true }),
      winston.format.printf(info => {
        const { timestamp, level, message, ...rest } = info;
        const moduleStr = module ? `[${module}]` : '';
        const restString = Object.keys(rest).length > 0 ?
          `\n${JSON.stringify(rest, null, 2)}` : '';

        return `${timestamp} ${level.toUpperCase()} ${moduleStr}: ${message}${restString}`;
      })
    ),
    defaultMeta: { service: 'bing-wallpaper-api' },
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.simple()
        )
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'error.log'),
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      }),
      new winston.transports.File({
        filename: path.join(logDir, 'combined.log'),
        maxsize: 5242880, // 5MB
        maxFiles: 2
      })
    ]
  });
}

module.exports = {
  createLogger
};