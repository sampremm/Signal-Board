/**
 * logger.util.js
 * Centralized structured logging utility.
 */

const formatMessage = (namespace, message, data) => {
  const logStr = `[${namespace}] ${message}`;
  if (data !== undefined) {
    if (data instanceof Error) {
      return `${logStr} - ${data.message} \nStack: ${data.stack}`;
    }
    return `${logStr} ${JSON.stringify(data)}`;
  }
  return logStr;
};

export const logger = {
  info: (namespace, message, data) => {
    console.log(formatMessage(namespace, message, data));
  },
  warn: (namespace, message, data) => {
    console.warn(formatMessage(namespace, message, data));
  },
  error: (namespace, message, error) => {
    console.error(formatMessage(namespace, message, error));
  },
  debug: (namespace, message, data) => {
    if (process.env.NODE_ENV !== 'production') {
      console.log(`[DEBUG] ${formatMessage(namespace, message, data)}`);
    }
  }
};
