import EventEmitter from 'events';
import { Engine } from '../engines/Engine';

export interface TTestEngine {
  simulateNavigation: (path: string) => void;
  engine: () => Engine;
}
export type TestEngineFactory = () => TTestEngine;

const TestEngine: TestEngineFactory = () => {
  const ee = new EventEmitter();
  return {
    simulateNavigation(path) {
      ee.emit('navigate', path);
    },

    engine: () => {
      let currentUrl = '/';

      const eng: Engine = {
        setup: () => {},
        teardown: () => {},
        navigate: (path) => {
          if (path !== currentUrl) {
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
        run: (path) => {
          const url = path || currentUrl;
          currentUrl = url;
          ee.emit('navigate', url);
        },
      };
      return eng;
    },
  };
};

export default TestEngine;
