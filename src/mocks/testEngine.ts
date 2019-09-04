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
  return {
    simulateNavigation(path) {
      ee.emit('navigate', path);
    },

    simulateExit(path) {
      ee.emit('exit', path);
    },

    engine: () => {
      let currentUrl = '/';
      let previousPath: string | null = null;

      const eng: Engine = {
        setup: () => {},
        teardown: () => {},
        navigate: (path) => {
          if (path !== currentUrl) {
            console.log(path, previousPath);
            if (previousPath) {
              ee.emit('exit', previousPath);
            }
            currentUrl = path;
            previousPath = path;
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
      return eng;
    },
  };
};

export default TestEngine;
