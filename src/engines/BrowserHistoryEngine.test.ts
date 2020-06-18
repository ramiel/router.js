import BrowserHistoryEngine from './BrowserHistoryEngine';
import WindowMock from '../mocks/windowMock';
import { Engine } from './Engine';

((global as unknown) as { window: WindowMock }).window = new WindowMock();

describe('Browser History Engine', () => {
  beforeEach(() => {
    ((window as unknown) as WindowMock).mockClear();
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

    test('on setup, the handlers are setup', () => {
      const engine = engineFactory();
      engine.setup();
      expect(window.addEventListener).toHaveBeenCalledTimes(2);
      expect(window.addEventListener).toHaveBeenNthCalledWith(
        1,
        'popstate',
        expect.any(Function),
      );
      expect(window.addEventListener).toHaveBeenNthCalledWith(
        2,
        'click',
        expect.any(Function),
      );
    });
  });

  describe('With a given engine', () => {
    let engine: Engine;
    const onNavigate = jest.fn();

    beforeEach(() => {
      engine = BrowserHistoryEngine()();
      engine.setup();
      engine.addRouteChangeHandler(onNavigate);
    });

    afterEach(() => {
      ((window as unknown) as WindowMock).mockClear();
      onNavigate.mockClear();
      engine.teardown();
    });

    test('when navigation happens, the route is executed', async () => {
      await engine.navigate('/there');
      expect(onNavigate).toHaveBeenCalledTimes(1);
      expect(onNavigate).toHaveBeenCalledWith('/there');
    });

    test('when navigation on the same path, the route is not executed', async () => {
      window.location.assign('https://routejs.com/same');
      await engine.navigate('/same');
      expect(onNavigate).toHaveBeenCalledTimes(0);
    });
  });
});
