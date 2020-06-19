import pathToRegexp, { Key } from 'path-to-regexp';
import BrowserHistoryEngine from './engines/BrowserHistoryEngine';
import { Engine } from './engines/Engine';

export interface RouteError extends Error {
  statusCode?: number;
}

export interface RouteContext {
  /**
   * The current path
   */
  path: string;
  /**
   * Set a value in the context
   */
  set: (key: string, value: unknown) => void;
  [prop: string]: unknown;
}

export interface Request {
  /**
   * Returns anything passed as params, or query string, in this order. Fallback to null or
   * a default value
   */
  get: (k: string, def?: string) => string | null | undefined;
  /**
   * The current path of the request
   */
  path: string;
  /**
   * A object contaning all the definied parameters found when matching the route
   */
  params: { [k: string]: string };
  /**
   * Any parameter with no name
   */
  splats: string[];
  /**
   * The query string keys/values
   */
  query: {
    [k: string]: string;
  };
  /**
   * Stop execution of other matching routes
   */
  stop: () => void;
  /**
   * Returns true if the route has been stopped
   */
  isStopped: () => boolean;
}

export type RouteCallback = (
  req: Request,
  ctx: RouteContext,
) => void | Promise<void>;

export type AlwaysCallback = (ctx: RouteContext) => void | Promise<void>;

export type ErrorCallback = (
  e: Error,
  context: RouteContext,
) => void | Promise<void>;

type ExecuteRoutes = (
  rs: Route[],
  a: AlwaysCallback[],
  path: string,
) => Promise<void>;

interface Route {
  url: string | RegExp;
  path: RegExp;
  paramNames: Key[];
  callback: RouteCallback;
}

export interface Router {
  /**
   * Add a new route to the router.
   * When the path visited in the browser matches the path definition, the callback is executed
   * @see https://github.com/ramiel/router.js#Usage
   */
  get: (path: string | RegExp, callback: RouteCallback) => Router;
  /**
   * Add an handler that runs when a route is left.
   * @see https://github.com/ramiel/router.js#Exithandlers
   */
  exit: (path: string | RegExp, callback: RouteCallback) => Router;
  /**
   * This callbacks are executed for any path change, even if the request has been stopped.
   * @see https://github.com/ramiel/router.js#Alwayscallbacks
   */
  always: (callback: AlwaysCallback) => Router;
  /**
   * Run the callback when a route produces an error. If the error has
   * a `statusCode` attached, it is matched. To catch any error use "*"
   * @see https://github.com/ramiel/router.js#Errors
   */
  error: (errorCode: number | '*', callback: ErrorCallback) => Router;
  /**
   * Navigate to a different path (like redirect)
   */
  navigate: (path: string) => void;
  /**
   * Navigate to any path but do not execute route handlers
   */
  setLocation: (path: string) => void;
  /**
   * Go to a specific page in the history
   * @param {Number} relative Relative position from the current page which is 0
   */
  go: (n?: number) => void;
  /**
   * Go back in the history
   */
  back: () => void;
  /**
   * GO forward in the history
   */
  forward: () => void;
  /**
   * Start route imediately, without waiting for the first user interaction.
   * If path is passed the browser is taken to that path, otherwise the route handler
   * relative to current path is executed
   */
  run: (path?: string) => Router;
  /**
   * Remove any listener setup by te router
   */
  teardown: () => Router;
  /**
   *Given a path, returns the correct path considering the basePath if any
   */
  buildUrl: (path: string) => string;
  /**
   * Returns the option with which the router has been created
   */
  getOptions: () => Omit<RouterOptions, 'engine'>;
  /**
   * @deprecated
   */
  _getOptions: () => Omit<RouterOptions, 'engine'>;
}

export interface RouterOptions {
  engine?: () => Engine;
  ignoreCase?: boolean;
  basePath?: string;
}

export type RouterFactoryType = (options?: RouterOptions) => Router;

interface CreateRequestOpts {
  path: string;
  params: { [k: string]: string };
  splats: string[];
}

// -------------------------- Implementation
const LEADING_BACKSLASHES_MATCH = /\/*$/;

const createContext = (path: string): RouteContext => {
  const context: RouteContext = {
    path,
    set: (key, value) => {
      context[key] = value;
    },
  };
  return context;
};

const createRequest = ({
  path,
  params,
  splats,
}: CreateRequestOpts): Request => {
  const [_, queryString] = path.split('?');
  const query = (queryString || '').split('&').reduce((acc, q) => {
    const [k, v] = q.split('=');
    if (!k) return acc;
    return {
      ...acc,
      [decodeURIComponent(k)]: decodeURIComponent(v),
    };
  }, {});
  let isStopped = false;

  const req: Request = {
    get: (key, def) =>
      // eslint-disable-next-line no-nested-ternary
      req.params && req.params[key] !== undefined
        ? req.params[key]
        : req.query && key in req.query // eslint-disable-line no-nested-ternary
        ? req.query[key]
        : def !== undefined
        ? def
        : undefined,
    path,
    params,
    splats,
    query,
    stop: () => {
      isStopped = true;
    },
    isStopped: () => isStopped,
  };

  return req;
};

const createExecuteRoutes = (context: RouteContext) => {
  const executeRoutes: ExecuteRoutes = async (matchedRoutes, always, path) => {
    if (matchedRoutes.length > 0) {
      const route = matchedRoutes[0];
      const params: { [p: string]: string } = {};
      const splats = [];
      const [pathWithoutQuery] = path.split('?');
      const match = pathWithoutQuery.match(route.path);
      /* istanbul ignore else */
      if (match) {
        let j = 0;
        for (j = 0; j < route.paramNames.length; j++) {
          params[route.paramNames[j].name] = match[j + 1];
        }
        /* If any other match put them in request splat */
        /* istanbul ignore else */
        if (j < match.length) {
          for (let k = j; k < match.length; k++) {
            splats.push(match[k]);
          }
        }
      }
      const req = createRequest({
        path,
        params,
        splats,
      });

      await route.callback(req, context);
      if (!req.isStopped() && matchedRoutes.length > 1) {
        return executeRoutes(matchedRoutes.slice(1), always, path);
      }
    }
    if (always.length > 0) {
      await always[0](context);
      if (always.length > 1) {
        return executeRoutes([], always.slice(1), path);
      }
    }

    return Promise.resolve();
  };

  return executeRoutes;
};

const defaultOptions = {
  ignoreCase: false,
  basePath: '/',
  engine: BrowserHistoryEngine(),
};

const createRouter: RouterFactoryType = (opt) => {
  interface Handlers {
    routes: Route[];
    exits: Route[];
  }
  const handlers: Handlers = {
    routes: [],
    exits: [],
  };
  const always: AlwaysCallback[] = [];
  const errors = new Map<number | '*', ErrorCallback[]>();
  const options = { ...defaultOptions, ...opt };
  const engine = options.engine();
  const cleanBasePath = options.basePath.replace(LEADING_BACKSLASHES_MATCH, '');
  const basePathRegExp = new RegExp(`^${cleanBasePath}`);

  /* eslint-disable no-console */
  errors.set(500, [
    (e, context) => {
      /* istanbul ignore else */
      if (console && console.error) {
        console.error(`500 - path: "${context.path}"`);
        console.error(e);
      }
    },
  ]);
  errors.set(404, [
    (e, context) => {
      /* istanbul ignore else */
      if (console && console.warn) {
        console.warn(`404 - path: "${context.path}"`);
        console.warn(e);
      }
    },
  ]);
  /* eslint-enable no-console */

  const errorThrowerFactory = (context: RouteContext) => (
    error: RouteError,
  ) => {
    const { statusCode = 500 } = error;
    const callbacks = errors.get(statusCode);
    const alwaysCallbacks = errors.get('*');

    /* istanbul ignore else */
    if (callbacks || alwaysCallbacks) {
      if (callbacks && callbacks.length > 0) {
        callbacks.forEach((callback) => {
          callback(error, context);
        });
      }
      if (alwaysCallbacks && alwaysCallbacks.length > 0) {
        alwaysCallbacks.forEach((callback) => {
          callback(error, context);
        });
      }
    } else {
      throw error;
    }
  };

  const onNavigation = (collectionName: 'routes' | 'exits') => async (
    path: string,
  ): Promise<void> => {
    const routes = handlers[collectionName];
    const matchedIndexes = [];
    // Path without base (contains query parameters)
    let cleanPath = path.replace(basePathRegExp, '');
    cleanPath = cleanPath === '' ? '/' : cleanPath;
    // Path without base and without qurey parameters
    let [urlToTest] = path.split('?');
    urlToTest = urlToTest.replace(basePathRegExp, '');
    urlToTest = urlToTest === '' ? '/' : urlToTest;

    for (let i = 0, len = routes.length; i < len; i++) {
      const route = routes[i];
      if (route.path.test(urlToTest)) {
        matchedIndexes.push(i);
      }
    }

    const context: RouteContext = createContext(cleanPath);
    if (collectionName === 'routes' && matchedIndexes.length === 0) {
      const e: RouteError = new Error(`Path "${cleanPath}" not matched`);
      e.statusCode = 404;
      errorThrowerFactory(context)(e);
    } else {
      try {
        const executeRoutes = createExecuteRoutes(context);
        await executeRoutes(
          matchedIndexes.map((i) => routes[i]),
          always,
          cleanPath,
        );
      } catch (e) {
        errorThrowerFactory(context)(e);
      }
    }
  };

  engine.setup();
  engine.addRouteChangeHandler(onNavigation('routes'));
  engine.addRouteExitHandler(onNavigation('exits'));

  const addRouteToCollection = (collectionName: 'routes' | 'exits') => (
    path: string | RegExp,
    callback: RouteCallback,
  ): void => {
    if (!callback) {
      throw new Error(`Missing callback for path "${path}"`);
    }
    const routes = handlers[collectionName];
    const paramNames: Key[] = [];

    const finalPath = pathToRegexp(path, paramNames, {
      sensitive: !options.ignoreCase,
      strict: false,
    });

    routes.push({
      url: path,
      path: finalPath,
      paramNames,
      callback,
    });
  };

  const router: Router = {
    get: (path, callback) => {
      addRouteToCollection('routes')(path, callback);
      return router;
    },

    exit: (path, callback) => {
      addRouteToCollection('exits')(path, callback);
      return router;
    },

    always: (callback) => {
      if (!callback) {
        throw new Error(
          'A callback is mandatory when defining an "always" callback!',
        );
      }
      always.push(callback);
      return router;
    },

    error: (errorCode, callback) => {
      errors.set(errorCode, [...(errors.get(errorCode) || []), callback]);
      return router;
    },

    run: (path) => {
      engine.run(path);
      return router;
    },

    teardown: () => {
      engine.teardown();
      return router;
    },
    navigate: engine.navigate,
    go: engine.go,
    back: engine.back,
    forward: engine.forward,
    setLocation: engine.setLocation,
    buildUrl: (path) => `${cleanBasePath}${path}`,

    getOptions: () => ({
      ...options,
      basePath: cleanBasePath,
      engine: undefined,
    }),

    _getOptions: () => {
      // eslint-disable-next-line no-console
      console.warn(
        '@deprecated _getOptions is deprecated, use getOptions instead',
      );
      return router.getOptions();
    },

    // @ts-ignore
    _showRoutes: () => {
      // eslint-disable-next-line no-console
      console.log(handlers);
    },
  };

  return router;
};

export default createRouter;
