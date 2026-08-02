import { Injectable, InjectionToken, inject, isDevMode } from '@angular/core';

export enum LogLevel {
  debug = 0,
  info = 1,
  warn = 2,
  error = 3,
}

export interface ConsoleLike {
  debug(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}

export const LOGGER_SINK = new InjectionToken<ConsoleLike>('LOGGER_SINK', {
  factory: () => console,
});

export const LOGGER_MIN_LEVEL = new InjectionToken<LogLevel>('LOGGER_MIN_LEVEL', {
  factory: () => (isDevMode() ? LogLevel.debug : LogLevel.warn),
});

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly sink = inject(LOGGER_SINK);
  private readonly minLevel = inject(LOGGER_MIN_LEVEL);

  debug(message: string, ...data: unknown[]): void {
    this.write(LogLevel.debug, message, data);
  }

  info(message: string, ...data: unknown[]): void {
    this.write(LogLevel.info, message, data);
  }

  warn(message: string, ...data: unknown[]): void {
    this.write(LogLevel.warn, message, data);
  }

  error(message: string, ...data: unknown[]): void {
    this.write(LogLevel.error, message, data);
  }

  private write(level: LogLevel, message: string, data: unknown[]): void {
    if (level < this.minLevel) {
      return;
    }
    const name = LogLevel[level].toLowerCase();
    const prefix = `[${new Date().toISOString()}] [${name.toUpperCase()}]`;
    const call: unknown[] =
      data.length === 0 ? [`${prefix} ${message}`] : [`${prefix} ${message}`, ...data];
    this.sink[name as keyof ConsoleLike](...call);
  }
}
