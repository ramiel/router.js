import { Engine, RouteHandler } from '../engines/Engine';

const createHistory = () => {
  let present: string | null = null;
  let past: string[] = [];
  let future: string[] = [];
  return {
    getCurrent: () => present,
    addEntry: (entry: string) => {
      past = [...past, present as string];
      present = entry;
    },
    go: (n: number = 0) => {
      if (n === 0) {
        return;
      }
      if (n < 0) {
        past = past.slice(0, n - 1);
        future = [...past.slice(0, n - 1), present as string, ...future];
        present = past[n];
      } else {
        past = [...past, present as string, ...future.slice(0, n - 1)];
        present = future[n];
        future = future.slice(n);
      }
    },
  };
};

export interface TTestEngine {
  simulateNavigation: (path: string) => void;
  simulateExit: (path: string) => void;
  engine: () => Engine;
}
export type TestEngineFactory = () => TTestEngine;

const TestEngine: TestEngineFactory = () => {
  const handlers: RouteHandler[] = [];
  const exitHandlers: RouteHandler[] = [];
  const history = createHistory();
  // let currentUrl: string | null = null;

  const executeHandlers = async (path: string) => {
    await handlers.reduce((acc, h) => {
      return acc.then(() => h(path));
    }, Promise.resolve());
  };

  const executeExitHandlers = async (path: string) => {
    await exitHandlers.reduce((acc, h) => {
      return acc.then(() => h(path));
    }, Promise.resolve());
  };

  const eng: Engine = {
    setup: () => {},
    teardown: () => {},
    navigate: async (path) => {
      const currentUrl = history.getCurrent();
      if (path !== currentUrl) {
        if (currentUrl) {
          await executeExitHandlers(currentUrl);
        }
        history.addEntry(path);
        await executeHandlers(path);
      }
    },
    go: history.go,
    back: () => history.go(-1),
    forward: () => history.go(1),
    setLocation: (path) => {
      const currentUrl = history.getCurrent();
      if (path !== currentUrl) {
        history.addEntry(path);
      }
    },
    addRouteChangeHandler: (handler) => {
      handlers.push(handler);
    },
    addRouteExitHandler: (handler) => {
      exitHandlers.push(handler);
    },
    run: (path) => {
      const currentUrl = history.getCurrent();
      const url = path || currentUrl;
      if (url) {
        history.addEntry(url);
        executeHandlers(url);
      }
    },
  };

  return {
    async simulateNavigation(path) {
      return eng.navigate(path);
    },

    async simulateExit(path) {
      return executeExitHandlers(path);
    },

    engine: () => eng,
  };
};

export default TestEngine;
