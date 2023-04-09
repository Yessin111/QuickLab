const log = require('simple-node-logger');

/**
  * The logger object.
  */
let serverLogger = log.createSimpleLogger('superlog.log');


/**
  * The functions and variables that you can access if you require this file.
  */
module.exports = {

  /**
    * The logger levels as constants.
    */
  fatal: 'fatal',
  error: 'error',
  warn: 'warn',
  info: 'info',
  debug: 'debug',

  /**
    * Function that initialises a new logger at the given path.
    *
    * @param path {String}
    * @return {undefined}
    */
  initialiseLogger(path) {
    serverLogger = log.createSimpleLogger(path);
  },

  /**
    * The changed logger to support synchronous logging for testing.
    */
  serverLogger: {
    ...serverLogger,

    synchronous: false,

    async fatal(args) {
      if (this.synchronous) {
        await process.stdout.write(`${new Date()} [FATAL]: ${args}\n`);
      } else serverLogger.fatal(...args);
    },

    async error(args) {
      if (this.synchronous) {
        await process.stdout.write(`${new Date()} [ERROR]: ${args}\n`);
      } else serverLogger.error(...args);
    },

    async warn(args) {
      if (this.synchronous) {
        await process.stdout.write(`${new Date()} [WARN]: ${args}\n`);
      } else serverLogger.warn(...args);
    },

    async info(args) {
      if (this.synchronous) {
        await process.stdout.write(`${new Date()} [INFO]: ${args}\n`);
      } else serverLogger.info(...args);
    },

    async debug(args) {
      if (this.synchronous) {
        await process.stdout.write(`${new Date()} [DEBUG]: ${args}\n`);
      } else serverLogger.debug(...args);
    },

    setSynchronous(bool) {
      this.synchronous = bool;
    },

  },

};
