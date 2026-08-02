import { LoggerService, LogLevel } from './logger.service';

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

  it('calls the sink method matching the level', () => {
    const logger = new LoggerService(sink, LogLevel.debug);
    logger.error('boom');
    expect(sink.error).toHaveBeenCalled();
  });

  it('prefixes the message with level and timestamp', () => {
    const logger = new LoggerService(sink, LogLevel.debug);
    logger.info('hola');
    expect(sink.info).toHaveBeenCalledWith(
      expect.stringMatching(/\[[0-9T:.Z-]+\] \[INFO\] hola/),
    );
  });

  it('forwards extra data alongside the message', () => {
    const logger = new LoggerService(sink, LogLevel.debug);
    logger.warn('cuidado', { a: 1 });
    expect(sink.warn).toHaveBeenCalledWith(
      expect.stringMatching(/\[WARN\] cuidado/),
      { a: 1 },
    );
  });

  it('drops messages below the minimum level', () => {
    const logger = new LoggerService(sink, LogLevel.error);
    logger.debug('a');
    logger.info('b');
    logger.warn('c');
    expect(sink.debug).not.toHaveBeenCalled();
    expect(sink.info).not.toHaveBeenCalled();
    expect(sink.warn).not.toHaveBeenCalled();
  });

  it('defaults to debug level so debug logs are emitted', () => {
    const logger = new LoggerService(sink);
    logger.debug('x');
    expect(sink.debug).toHaveBeenCalled();
  });
});
