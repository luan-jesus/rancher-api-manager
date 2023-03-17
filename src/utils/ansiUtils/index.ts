export enum AnsiColor {
  RED = '\u001b[31m',
  YELLOW = '\u001b[33m',
  GREEN = '\u001b[32m',
  LIGHT_BLUE = '\u001b[36m',
  RESET = '\u001b[0m'
}

export function ansiTextColor(text: string, color: AnsiColor): string {
  return color + text + AnsiColor.RESET;
}
