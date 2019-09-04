import { Engine, RouteHandler } from './Engine';

interface BrowserHistoryEngineOptions {
  bindClick?: boolean;
}

type BrowserHistoryEngineCreator = (
  opt?: BrowserHistoryEngineOptions,
) => () => Engine;

const defaultOptions: BrowserHistoryEngineOptions = {
  bindClick: true,
};

const hasDifferentOrigin = (href: string): boolean => {
  const url = new URL(href, window.location.origin);
  return url.origin !== window.location.origin;
};

const BrowserHistoryEngine: BrowserHistoryEngineCreator = (opt = {}) => () => {
  let engine: Engine;
  const options = {
    ...defaultOptions,
    ...opt,
  };
  const handlers: RouteHandler[] = [];
  const exitHandlers: RouteHandler[] = [];
  let previousPath: string | null = null;

  const executeHandlers = (path: string) => {
    handlers.forEach((handler) => {
      handler(path);
    });
  };

  const executeExitHandlers = (path: string) => {
    exitHandlers.forEach((handler) => {
      handler(path);
    });
  };

  const clickHandler = (e: MouseEvent) => {
    if (e.target && (e.target as HTMLElement).nodeName.toUpperCase() === 'A') {
      const target = e.target as HTMLAnchorElement;
      if (
        target.hasAttribute('data-routerjs-ignore') ||
        target.hasAttribute('download') ||
        target.hasAttribute('target') ||
        target.getAttribute('rel') === 'external'
      ) {
        return;
      }
      const href = target.getAttribute('href');
      if (
        href &&
        (hasDifferentOrigin(href) ||
          href.indexOf('mailto:') === 0 ||
          href.indexOf('tel:') === 0)
      ) {
        return;
      }
      e.preventDefault();
      engine.navigate(target.pathname);
    }
  };

  const popStateHandler = (_ev: PopStateEvent) => {
    if (previousPath !== null) {
      executeExitHandlers(previousPath);
    }
    previousPath = window.location.pathname;
    executeHandlers(window.location.pathname);
  };

  engine = {
    setup: () => {
      window.addEventListener('popstate', popStateHandler);

      if (options.bindClick) {
        window.addEventListener('click', clickHandler);
      }
    },

    teardown: () => {
      window.removeEventListener('popstate', popStateHandler);
      window.removeEventListener('click', clickHandler);
    },

    addRouteChangeHandler: (handler) => {
      handlers.push(handler);
    },

    addRouteExitHandler: (handler) => {
      exitHandlers.push(handler);
    },

    navigate: (path) => {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
        executeHandlers(path);
      }
    },

    setLocation: (path) => {
      if (window.location.pathname !== path) {
        window.history.pushState({}, '', path);
      }
    },

    run: (path?: string) => {
      const url = path || window.location.pathname;
      if (window.location.pathname !== url) {
        window.history.pushState({}, '', url);
      }
      executeHandlers(url);
    },
  };

  return engine;
};

export default BrowserHistoryEngine;
