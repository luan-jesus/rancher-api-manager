/* eslint-disable @typescript-eslint/no-explicit-any */
// eslint-disable-next-line @typescript-eslint/no-var-requires
export const ansiColorRed = '\u001b[31m';
export const ansiColorYellow = '\u001b[33m';
export const ansiColorGreen = '\u001b[32m';
export const ansiColorLightBlue = '\u001b[36m';
export const ansiReset    = '\u001b[0m';

function info(message: string, ...args: any) {
  console.info(`[${new Date().toISOString()}]    INFO: ${message}`, ...args);
}

function warn(message: string, ...args: any) {
  console.warn(`[${new Date().toISOString()}]    ${ansiColorYellow}WARN${ansiReset}: ${message}`, ...args);
}

function error(message: string, ...args: any) {
  console.error(`[${new Date().toISOString()}]   ${ansiColorRed}ERROR${ansiReset}: ${message}`, ...args);
}

function success(message: string, ...args: any) {
  console.info(`[${new Date().toISOString()}] ${ansiColorGreen}SUCCESS${ansiReset}: ${message}`, ...args);
}

export default { info, warn, error, success };
