const timestamp = () => new Date().toISOString();

export const logger = {
  info: (...args) => console.log(`[socket] ${timestamp()}`, ...args),
  warn: (...args) => console.warn(`[socket] ${timestamp()}`, ...args),
  error: (...args) => console.error(`[socket] ${timestamp()}`, ...args),
};

export default logger;
