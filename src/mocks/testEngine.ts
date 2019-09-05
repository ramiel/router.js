import EventEmitter from 'events';
import { Engine } from '../engines/Engine';

export interface TTestEngine {
  simulateNavigation: (path: string) => void;
  simulateExit: (path: string) => void;
  engine: () => Engine;
}
export type TestEngineFactory = () => TTestEngine;

const TestEngine: TestEngineFactory = () => {
  const ee = new EventEmitter();

  let currentUrl: string | null = null;

  const eng: Engine = {
    setup: () => {},
    teardown: () => {},
    navigate: (path) => {
      if (path !== currentUrl) {
        if (currentUrl) {
          ee.emit('exit', currentUrl);
        }
        currentUrl = path;
        ee.emit('navigate', path);
      }
    },
    setLocation: (path) => {
      if (path !== currentUrl) {
        currentUrl = path;
      }
    },
    addRouteChangeHandler: (handler) => {
      ee.on('navigate', handler);
    },
    addRouteExitHandler: (handler) => {
      ee.on('exit', handler);
    },
    run: (path) => {
      const url = path || currentUrl;
      currentUrl = url;
      ee.emit('navigate', url);
    },
  };

  return {
    simulateNavigation(path) {
      eng.navigate(path);
    },

    simulateExit(path) {
      ee.emit('exit', path);
    },

    engine: () => eng,
  };
};

export default TestEngine;
