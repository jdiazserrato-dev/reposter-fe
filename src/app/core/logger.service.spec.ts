import { TestBed } from '@angular/core/testing';
import {
  LoggerService,
  LogLevel,
  LOGGER_SINK,
  LOGGER_MIN_LEVEL,
} from './logger.service';

describe('LoggerService', () => {
  type MockFn = (...args: unknown[]) => void;

  let sink: {
    debug: MockFn;
    info: MockFn;
    warn: MockFn;
    error: MockFn;
  };

  beforeEach(() => {
    sink = {
      debug: vi.fn<MockFn>(),
      info: vi.fn<MockFn>(),
      warn: vi.fn<MockFn>(),
      error: vi.fn<MockFn>(),
    };
  });

  const makeLogger = (minLevel: LogLevel = LogLevel.debug): LoggerService => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        { provide: LOGGER_SINK, useValue: sink },
        { provide: LOGGER_MIN_LEVEL, useValue: minLevel },
      ],
    });
    return TestBed.inject(LoggerService);
  };

  it('calls the sink method matching the level', () => {
    makeLogger().error('boom');
    expect(sink.error).toHaveBeenCalled();
  });

  it('prefixes the message with level and timestamp', () => {
    makeLogger().info('hola');
    expect(sink.info).toHaveBeenCalledWith(
      expect.stringMatching(/\[[0-9T:.Z-]+\] \[INFO\] hola/),
    );
  });

  it('forwards extra data alongside the message', () => {
    makeLogger().warn('cuidado', { a: 1 });
    expect(sink.warn).toHaveBeenCalledWith(
      expect.stringMatching(/\[WARN\] cuidado/),
      { a: 1 },
    );
  });

  it('drops messages below the minimum level', () => {
    const logger = makeLogger(LogLevel.error);
    logger.debug('a');
    logger.info('b');
    logger.warn('c');
    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).not.toHaveBeenCalled();
  });

  it('defaults to debug level so debug logs are emitted', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [{ provide: LOGGER_SINK, useValue: sink }],
    });
    const logger = TestBed.inject(LoggerService);
    logger.debug('x');
    expect(sink.debug).toHaveBeenCalled();
  });
});
