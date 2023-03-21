/* eslint-disable @typescript-eslint/no-explicit-any */
import { ansiTextColor, AnsiColor } from '@/utils/ansi-utils';

function info(message: string, ...args: any) {
  console.info(`${new Date().toISOString()}    [INFO]: ${message}`, ...args);
}

function warn(message: string, ...args: any) {
  console.warn(`${new Date().toISOString()}    ${ansiTextColor('[WARN]', AnsiColor.YELLOW)}: ${message}`, ...args);
}

function error(message: string, ...args: any) {
  console.error(`${new Date().toISOString()}   ${ansiTextColor('[ERROR]', AnsiColor.RED)}: ${message}`, ...args);
}

function success(message: string, ...args: any) {
  console.info(`${new Date().toISOString()} ${ansiTextColor('[SUCCESS]', AnsiColor.GREEN)}: ${message}`, ...args);
}

export default { info, warn, error, success };
