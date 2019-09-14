import BrowserHistoryEngine from './engines/BrowserHistoryEngine';
import { Engine } from './engines/Engine';

interface RouteError extends Error {
  statusCode?: number;
}

export interface RouteContext {
  path: string;
  set: (key: string, value: any) => void; // eslint-disable-line @typescript-eslint/no-explicit-any
  [prop: string]: any; // eslint-disable-line @typescript-eslint/no-explicit-any
}

export interface Request {
  get: (k: string, def?: string) => string | null | undefined;
  path: string;
  params: { [k: string]: string };
  splats: string[];
  query: {
    [k: string]: string;
  };
  stop: () => void;
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
  paramNames: string[];
  callback: RouteCallback;
}

export interface Router {
  get: (path: string | RegExp, callback: RouteCallback) => Router;
  exit: (path: string | RegExp, callback: RouteCallback) => Router;
  always: (callback: AlwaysCallback) => Router;
  error: (errorCode: number | '*', callback: ErrorCallback) => Router;
  navigate: (path: string) => void;
  run: (path?: string) => Router;
  teardown: () => Router;
  buildUrl: (path: string) => string;
  _getOptions: () => Omit<RouterOptions, 'engine'>;
}

export interface RouterOptions {
  engine: () => Engine;
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

const PATH_REPLACER = '([^/\\?]+)';
const PATH_NAME_MATCHER = /:([\w\d]+)/g;
const PATH_EVERY_MATCHER = /\/\*(?!\*)/;
const PATH_EVERY_REPLACER = '/?([^/\\?]*)';
const PATH_EVERY_GLOBAL_MATCHER = /\/\*{2}/;
const PATH_EVERY_GLOBAL_REPLACER = '(.*?)\\??';

const PATH_SOMETHING_MATCHER = /\/\+(?!\+)/;
const PATH_SOMETHING_REPLACER = '/?([^/\\?]+)';

const PATH_SOMETHING_GLOBAL_MATCHER = /\/\+{2}/;
const PATH_SOMETHING_GLOBAL_REPLACER = '(.+?)\\??';

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
      const match = path.match(route.path);
      /* istanbul ignore else */
      if (match) {
        let j = 0;
        for (j = 0; j < route.paramNames.length; j++) {
          params[route.paramNames[j]] = match[j + 1];
        }
        j += 1;
        /* If any other match put them in request splat */
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

interface DefaultOptions extends RouterOptions {
  ignoreCase: boolean;
  basePath: string;
}
const defaultOptions: DefaultOptions = {
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
    let cleanPath = path
      .replace(LEADING_BACKSLASHES_MATCH, '')
      .replace(basePathRegExp, '');
    cleanPath = cleanPath === '' ? '/' : cleanPath;
    const urlToTest = cleanPath
      .split('?')[0]
      .replace(LEADING_BACKSLASHES_MATCH, '');

    for (let i = 0, len = routes.length; i < len; i++) {
      const route = routes[i];
      if (route.path.test(urlToTest)) {
        matchedIndexes.push(i);
      }
    }

    const context: RouteContext = createContext(cleanPath);
    if (collectionName === 'routes' && matchedIndexes.length === 0) {
      const e: RouteError = new Error(`Path "${path}" not matched`);
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
    let finalPath;
    const paramNames = [];

    if (typeof path === 'string') {
      const modifiers = options.ignoreCase ? 'i' : '';
      // Remove leading backslash from the end of the string
      finalPath = path.replace(LEADING_BACKSLASHES_MATCH, '');
      let match = PATH_NAME_MATCHER.exec(finalPath);
      /* Param Names are all the one defined as :param in the path */
      while (match !== null) {
        paramNames.push(match[1]);
        match = PATH_NAME_MATCHER.exec(finalPath);
      }
      finalPath = new RegExp(
        `^${finalPath
          .replace(PATH_NAME_MATCHER, PATH_REPLACER)
          .replace(PATH_EVERY_MATCHER, PATH_EVERY_REPLACER)
          .replace(PATH_SOMETHING_MATCHER, PATH_SOMETHING_REPLACER)
          .replace(
            PATH_SOMETHING_GLOBAL_MATCHER,
            PATH_SOMETHING_GLOBAL_REPLACER,
          )
          .replace(
            PATH_EVERY_GLOBAL_MATCHER,
            PATH_EVERY_GLOBAL_REPLACER,
          )}(?:\\?.+)?$`,
        modifiers,
      );
    } else if (path instanceof RegExp) {
      finalPath = path;
    } else {
      throw new Error(`"${path}" must be a string or a RegExp`);
    }
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

    buildUrl: (path) => `${cleanBasePath}${path}`,

    _getOptions: () => ({
      ...options,
      basePath: cleanBasePath,
      engine: undefined,
    }),

    // @ts-ignore
    _showRoutes: () => {
      // eslint-disable-next-line no-console
      console.log(handlers);
    },
  };

  return router;
};

export default createRouter;
