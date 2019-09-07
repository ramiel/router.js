import BrowserHistoryEngine from './BrowserHistoryEngine';

// @ts-ignore
const addEventListenerSpy = jest.spyOn(global.window, 'addEventListener');

describe('Browser History Engine', () => {
  beforeEach(() => {
    addEventListenerSpy.mockClear();
  });

  describe('general', () => {
    test('is a function that returns a factory', () => {
      expect(BrowserHistoryEngine()).toBeInstanceOf(Function);
    });

    test('the factory returns an engine', () => {
      const engine = BrowserHistoryEngine()();
      expect(engine).toHaveProperty('setup', expect.any(Function));
      expect(engine).toHaveProperty(
        'addRouteChangeHandler',
        expect.any(Function),
      );
    });
  });

  describe('route handlers', () => {
    const engineFactory = BrowserHistoryEngine();

    test('can add an handler', () => {
      const engine = engineFactory();
      expect(() => engine.addRouteChangeHandler(() => {})).not.toThrow();
    });

    test('can add an exit handler', () => {
      const engine = engineFactory();
      expect(() => engine.addRouteExitHandler(() => {})).not.toThrow();
    });

    test('can setup the engine', () => {
      const engine = engineFactory();
      expect(engine.setup).not.toThrow();
    });

    test('on setup, an handler for popstate event is created', () => {});
  });
});
