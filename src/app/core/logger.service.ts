import { Injectable, Inject, InjectionToken, isDevMode } from '@angular/core';

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

export const LOGGER_SINK = new InjectionToken<ConsoleLike>('LOGGER_SINK');

export const LOGGER_MIN_LEVEL = new InjectionToken<LogLevel>('LOGGER_MIN_LEVEL');

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private readonly sink: ConsoleLike;
  private readonly minLevel: LogLevel;

  constructor(
    @Inject(LOGGER_SINK) sink: ConsoleLike = console,
    @Inject(LOGGER_MIN_LEVEL) minLevel: LogLevel = isDevMode() ? LogLevel.debug : LogLevel.warn,
  ) {
    this.sink = sink;
    this.minLevel = minLevel;
  }

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
