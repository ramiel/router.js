import BrowserHistoryEngine from './BrowserHistoryEngine';
import WindowMock from '../mocks/windowMock';
import { Engine } from './Engine';

((global as unknown) as { window: WindowMock }).window = new WindowMock();

const createMouseEvent = ({
  attributes,
}: {
  attributes: { [k: string]: unknown };
}): MouseEvent => {
  const event = ({
    preventDefault: () => {},
    target: ({
      nodeName: 'a',
      pathname: attributes.href,
      hasAttribute: (k: string) => k in attributes,
      getAttribute: (k: string) => attributes[k],
    } as unknown) as HTMLAnchorElement,
  } as unknown) as MouseEvent;
  return event;
};

const testAtEnd = (fn: Function) => {
  return new Promise((r) => {
    setTimeout(() => {
      fn();
      r();
    }, 1);
  });
};

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

    test('when anchor is clicked, the route is executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({ attributes: { href: '/there' } }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(1);
        expect(onNavigate).toHaveBeenCalledWith('/there');
      });
    });

    test('when anchor with data-routerjs-ignore is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: '/there', 'data-routerjs-ignore': true },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });

    test('when anchor with download attribute is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: '/there', download: true },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });

    test('when anchor with rel=external is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: '/there', rel: 'external' },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });

    test('when anchor with rel!=external is clicked, the route is executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: '/there', rel: 'internal' },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(1);
      });
    });

    test('when anchor with target attribute is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: '/there', target: 'any' },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });

    test('when anchor with mail href is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: 'mailto:any@home.com' },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });

    test('when anchor with telephone href is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: 'tel:+00000' },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });

    test('when anchor with external domain href is clicked, the route is not executed', async () => {
      ((window as unknown) as WindowMock).emit(
        'click',
        createMouseEvent({
          attributes: { href: 'https://external.com/there' },
        }),
      );
      return testAtEnd(() => {
        expect(onNavigate).toHaveBeenCalledTimes(0);
      });
    });
  });
});
