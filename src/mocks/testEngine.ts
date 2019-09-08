import { Engine, RouteHandler } from '../engines/Engine';

export interface TTestEngine {
  simulateNavigation: (path: string) => void;
  simulateExit: (path: string) => void;
  engine: () => Engine;
}
export type TestEngineFactory = () => TTestEngine;

const TestEngine: TestEngineFactory = () => {
  const handlers: RouteHandler[] = [];
  const exitHandlers: RouteHandler[] = [];
  let currentUrl: string | null = null;

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
      if (path !== currentUrl) {
        if (currentUrl) {
          await executeExitHandlers(currentUrl);
        }
        currentUrl = path;
        await executeHandlers(path);
      }
    },
    setLocation: (path) => {
      if (path !== currentUrl) {
        currentUrl = path;
      }
    },
    addRouteChangeHandler: (handler) => {
      handlers.push(handler);
    },
    addRouteExitHandler: (handler) => {
      exitHandlers.push(handler);
    },
    run: (path) => {
      const url = path || currentUrl;
      currentUrl = url;
      if (url) {
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
