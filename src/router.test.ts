import mockConsole, { RestoreConsole } from 'jest-mock-console';
import RouterFactory, { Router, Request } from './router';
import TestEngine, { TTestEngine } from './mocks/testEngine';

jest.mock('./engines/BrowserHistoryEngine', () => () => () => ({
  setup: () => {},
  addRouteChangeHandler: () => {},
}));

describe('Router', () => {
  let restoreConsole: RestoreConsole;
  beforeEach(() => {
    restoreConsole = mockConsole();
  });

  afterEach(() => {
    restoreConsole();
  });

  describe('basic operations', () => {
    const mockEngine = TestEngine();
    test('a router can be created', () => {
      const router = RouterFactory({
        engine: mockEngine.engine,
      });
      expect(router).not.toBeUndefined();
    });

    test('a router can be created without any options', () => {
      const router = RouterFactory();
      expect(router).not.toBeUndefined();
    });
  });

  describe('routes', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
      });
    });

    test('a route can be added', () => {
      expect(() => router.get('/', () => {})).not.toThrow();
    });

    test('a route cannot be added without a callback', () => {
      // @ts-ignore
      expect(() => router.get('/')).toThrow();
    });

    test('sync callback is executed', () => {
      const spy = jest.fn(() => {});
      router.get('/', spy);
      testEngine.simulateNavigation('/');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('router can be configured to be case sensitive', () => {
      const csrouter = RouterFactory({
        ignoreCase: false,
        engine: testEngine.engine,
      });
      const spy = jest.fn(() => {});
      const spy2 = jest.fn(() => {});
      csrouter.get('/something', spy);
      csrouter.get('/someThing', spy2);
      testEngine.simulateNavigation('/someThing');
      expect(spy).not.toHaveBeenCalled();
      expect(spy2).toHaveBeenCalledTimes(1);
    });

    test('promise callback is executed', () => {
      const spy = jest.fn(async () => {});
      router.get('/', spy);
      testEngine.simulateNavigation('/');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('promises callback are executed in order', () => {
      const spy = jest.fn();
      return new Promise((resolve) => {
        let value = 0;
        router.get('/', async () => {
          await new Promise((r) => {
            setTimeout(() => {
              expect(value).toBe(0);
              spy();
              r();
            }, 0);
          });
        });
        router.get('/', () => {
          value = 1;
          expect(spy).toHaveBeenCalled();
          resolve();
        });
        testEngine.simulateNavigation('/');
      });
    });

    test('a route can be expressed as a regexp', () => {
      const spy = jest.fn(async () => {});
      router.get(/\/home/, spy);
      testEngine.simulateNavigation('/home');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('a route expressed as a regexp works as intended', () => {
      const spy = jest.fn(async () => {});
      const spy2 = jest.fn(async () => {});
      router.get(/\/home/, spy);
      router.get(/\/account/, spy2);
      testEngine.simulateNavigation('/account');
      expect(spy).toHaveBeenCalledTimes(0);
      expect(spy2).toHaveBeenCalledTimes(1);
      expect(spy2).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('second match is followed', (done) => {
      const spy = jest.fn(() => {});
      const spy2 = jest.fn(() => {});
      router.get('/a', spy);
      router.get('/:x', spy2);
      testEngine.simulateNavigation('/a');
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        done();
      }, 0);
    });

    test('second match is not followed if first stop', (done) => {
      const spy = jest.fn((req: Request) => {
        req.stop();
      });
      const spy2 = jest.fn(() => {});
      router.get('/a', spy);
      router.get('/:x', spy2);
      testEngine.simulateNavigation('/a');
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(0);
        done();
      }, 0);
    });

    test('second async match is followed', (done) => {
      const spy = jest.fn(async () => {});
      const spy2 = jest.fn(async () => {});
      router.get('/a', spy);
      router.get('/:x', spy2);
      testEngine.simulateNavigation('/a');
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(1);
        done();
      }, 0);
    });

    test('second async match is not followed if first stop', (done) => {
      const spy = jest.fn(async (req: Request) => {
        req.stop();
      });
      const spy2 = jest.fn(async () => {});
      router.get('/a', spy);
      router.get('/:x', spy2);
      testEngine.simulateNavigation('/a');
      setTimeout(() => {
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy2).toHaveBeenCalledTimes(0);
        done();
      }, 0);
    });

    test('follow a route with leading slash', () => {
      const spy = jest.fn(() => {});
      router.get('/a', spy);
      testEngine.simulateNavigation('/a/');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('follow a route with query params', () => {
      const spy = jest.fn(() => {});
      router.get('/a', spy);
      testEngine.simulateNavigation('/a?key=value');
      expect(spy).toHaveBeenCalledTimes(1);
      expect(spy).toHaveBeenCalledWith(expect.any(Object), expect.any(Object));
    });

    test('non matching route is not called', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a', spy);
        testEngine.simulateNavigation('/b');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(0);
          resolve();
        }, 0);
      }));

    test('non matching route is not called, after a match', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a', () => {});
        router.get('/b', spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(0);
          resolve();
        }, 0);
      }));

    test('* matches the next trait', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a/*', spy);
        testEngine.simulateNavigation('/a/something');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('* is something, not nothing', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a/*', spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(0);
          resolve();
        }, 0);
      }));

    test('* doesnt match multiple paths', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a/*', spy);
        testEngine.simulateNavigation('/a/something/more');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(0);
          resolve();
        }, 0);
      }));

    test('* can match one-trait path', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/*', spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('** matches multiple paths', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a/**', spy);
        testEngine.simulateNavigation('/a/something/more');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('** can be used to match anything', () => {
      const spy = jest.fn(() => {});
      router.get('/**', spy);
      testEngine.simulateNavigation('/any/thing/i/want');
      expect(spy).toHaveBeenCalledTimes(1);
    });
  });

  describe('route context', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
      });
    });

    test('context is passed to route handler', async () => {
      return new Promise((resolve, reject) => {
        router
          .get('/', (req, context) => {
            expect(context).toBeDefined();
            expect(context).toHaveProperty('path', '/');
            resolve();
          })
          .error(500, reject);
        testEngine.simulateNavigation('/');
      });
    });

    test('context contains current path', async () => {
      return new Promise((resolve, reject) => {
        router
          .get('/:name/:surname', (req, context) => {
            expect(context).toHaveProperty('path', '/bilbo/county');
            resolve();
          })
          .error(500, reject);
        testEngine.simulateNavigation('/bilbo/county');
      });
    });

    test('context contains cleaned path', async () => {
      return new Promise((resolve, reject) => {
        router
          .get('/:name/:surname', (req, context) => {
            expect(context).toHaveProperty('path', '/bilbo/county');
            resolve();
          })
          .error(500, reject);
        testEngine.simulateNavigation('/bilbo/county//');
      });
    });

    test('context is kept among routes', async () => {
      return new Promise((resolve, reject) => {
        router
          .get('/*', (req, context) => {
            expect(context).not.toHaveProperty('key');

            context.key = 'value'; // eslint-disable-line
          })
          .get('/:name', (req, context) => {
            expect(context).toBeDefined();
            expect(context).toHaveProperty('key', 'value');
            resolve();
          })
          .error(500, reject);
        testEngine.simulateNavigation('/bilbo');
      });
    });

    test('context.set can be used to change context', async () => {
      return new Promise((resolve, reject) => {
        router
          .get('/*', (req, context) => {
            expect(context).not.toHaveProperty('tree');

            context.set('tree', 'orange'); // eslint-disable-line
          })
          .get('/:name', (req, context) => {
            expect(context).toBeDefined();
            expect(context).toHaveProperty('tree', 'orange');
            resolve();
          })
          .error(500, reject);
        testEngine.simulateNavigation('/bilbo');
      });
    });
  });

  describe('always functions', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
      });
    });

    test('cannot be defined without a callback', () => {
      // @ts-ignore
      expect(() => router.always()).toThrow();
    });

    test('is called, if the flow is not stopped', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a', () => {}).always(spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              path: '/a',
            }),
          );
          resolve();
        }, 0);
      }));

    test('is called, if the flow is not stopped, multiple paths', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router
          .get('/a', () => {})
          .get('/:letter', () => {})
          .always(spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              path: '/a',
            }),
          );
          resolve();
        }, 0);
      }));

    test('is called, if the flow is stopped', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router
          .get('/a', (req) => {
            req.stop();
          })
          .always(spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              path: '/a',
            }),
          );
          resolve();
        }, 0);
      }));

    test('is called, if the flow is lately stopped', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router
          .get('/a', () => {})
          .get('/letter', (req) => {
            req.stop();
          })
          .always(spy);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy).toHaveBeenCalledWith(
            expect.objectContaining({
              path: '/a',
            }),
          );
          resolve();
        }, 0);
      }));

    test('all the registered always are called', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        const spy2 = jest.fn(() => {});
        router
          .get('/a', (req) => {
            req.stop();
          })
          .always(spy)
          .always(spy2);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy2).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('all the registered always are called (async)', () =>
      new Promise((resolve) => {
        const spy = jest.fn(async () => {});
        const spy2 = jest.fn(async () => {});
        router
          .get('/a', (req) => {
            req.stop();
          })
          .always(spy)
          .always(spy2);
        testEngine.simulateNavigation('/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          expect(spy2).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('always get the current context', () => {
      return new Promise((resolve) => {
        router
          .get('/a', (req) => {
            req.stop();
          })
          .always((context) => {
            expect(context).toHaveProperty('path', '/a');
          })
          .always(resolve);
        testEngine.simulateNavigation('/a');
      });
    });
  });

  describe('basePath', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
        basePath: '/base',
      });
    });

    test('basePath is ignored', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/', spy);
        testEngine.simulateNavigation('/base');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('basePath is ignored, second level path', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/a', spy);
        testEngine.simulateNavigation('/base/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('basePath is ignored, named path', () =>
      new Promise((resolve) => {
        const spy = jest.fn(() => {});
        router.get('/:letter', spy);
        testEngine.simulateNavigation('/base/a');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('basePath is ignored, and params are populated', () =>
      new Promise((resolve) => {
        const spy = jest.fn((req) => {
          expect(req.params).toHaveProperty('letter', 'a');
          resolve();
        });
        router.get('/:letter', spy);
        testEngine.simulateNavigation('/base/a');
      }));
  });

  describe('error handlers', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
      });
    });

    test('if a route throws, the 500 error handler is called', () =>
      new Promise((resolve) => {
        const spy = jest.fn();
        router
          .get('/', async () => {
            throw new Error('e');
          })
          .error(500, spy);
        testEngine.simulateNavigation('/');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('default 500 error handler calls the console', () =>
      new Promise((resolve) => {
        router.get('/', async () => {
          throw new Error('e');
        });
        testEngine.simulateNavigation('/');
        setTimeout(() => {
          // eslint-disable-next-line no-console
          expect(console.error).toHaveBeenCalledTimes(2);
          resolve();
        }, 0);
      }));

    test('more handlers can be added for the same error', () =>
      new Promise((resolve) => {
        const spy = jest.fn();
        router
          .get('/', async () => {
            throw new Error('e');
          })
          .error(500, spy)
          .error(500, spy);
        testEngine.simulateNavigation('/');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(2);
          resolve();
        }, 0);
      }));

    test('if a route is not found, the 404 error handler is called', () =>
      new Promise((resolve) => {
        const spy = jest.fn();
        router.get('/', async () => {}).error(404, spy);
        testEngine.simulateNavigation('/notexists');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(1);
          resolve();
        }, 0);
      }));

    test('default 404 error handler calls the console', () =>
      new Promise((resolve) => {
        router.get('/', async () => {});
        testEngine.simulateNavigation('/notexists');
        setTimeout(() => {
          // eslint-disable-next-line no-console
          expect(console.warn).toHaveBeenCalledTimes(2);
          resolve();
        }, 0);
      }));

    test('can add custom handler', () =>
      new Promise((resolve) => {
        const e = new Error('Unhautorized');
        // @ts-ignore
        e.statusCode = 403;
        router
          .get('/', async () => {
            throw e;
          })
          .error(403, (err, context) => {
            expect(context).toHaveProperty('path', '/');
            expect(err).toBe(e);
            resolve();
          });
        testEngine.simulateNavigation('/');
      }));

    test('can listen to any error with "*"', () =>
      new Promise((resolve) => {
        const e = new Error('Unhautorized');
        // @ts-ignore
        e.statusCode = 403;
        router
          .get('/', async () => {
            throw e;
          })
          .error('*', (err, context) => {
            expect(context).toHaveProperty('path', '/');
            expect(err).toBe(e);
            resolve();
          });
        testEngine.simulateNavigation('/');
      }));

    test('more "*" error handlers can be added', () =>
      new Promise((resolve) => {
        const spy = jest.fn();
        router
          .get('/', async () => {
            throw new Error('e');
          })
          .error('*', spy)
          .error('*', spy);
        testEngine.simulateNavigation('/');
        setTimeout(() => {
          expect(spy).toHaveBeenCalledTimes(2);
          resolve();
        }, 0);
      }));
  });

  describe('params', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
      });
    });

    test('param has the corrent value', () =>
      new Promise((resolve) => {
        router.get('/:name', (req) => {
          expect(req.params).toHaveProperty('name', 'john');
          resolve();
        });
        testEngine.simulateNavigation('/john');
      }));

    test('param can be taken by "get" function', () =>
      new Promise((resolve) => {
        router.get('/:name', (req) => {
          expect(req.get('name')).toBe('john');
          resolve();
        });
        testEngine.simulateNavigation('/john');
      }));

    test('param can be in any position', () =>
      new Promise((resolve) => {
        router.get('/a/:name', (req) => {
          expect(req.params).toHaveProperty('name', 'john');
          resolve();
        });
        testEngine.simulateNavigation('/a/john');
      }));

    test('can have multiple params', () =>
      new Promise((resolve) => {
        router.get('/:name/:job', (req) => {
          expect(req.params).toHaveProperty('name', 'carl');
          expect(req.params).toHaveProperty('job', 'sceriff');
          resolve();
        });
        testEngine.simulateNavigation('/carl/sceriff');
      }));

    test('return undefined if param doesnt exist', () =>
      new Promise((resolve) => {
        router.get('/:name/:job', (req) => {
          expect(req.params).toHaveProperty('another', undefined);
          resolve();
        });
        testEngine.simulateNavigation('/carl/sceriff');
      }));

    test('with "get" return undefined if param doesnt exist', () =>
      new Promise((resolve) => {
        router.get('/:name/:job', (req) => {
          expect(req.get('another')).toBeUndefined();
          resolve();
        });
        testEngine.simulateNavigation('/carl/sceriff');
      }));

    test('with "get"return default if param doesnt exist', () =>
      new Promise((resolve) => {
        router.get('/:name/:job', (req) => {
          expect(req.get('another', 'defValue')).toBe('defValue');
          resolve();
        });
        testEngine.simulateNavigation('/carl/sceriff');
      }));
  });

  describe('query params', () => {
    let router: Router;
    let testEngine: TTestEngine;

    beforeEach(() => {
      testEngine = TestEngine();
      router = RouterFactory({
        engine: testEngine.engine,
      });
    });

    test('query param has the corrent value', () =>
      new Promise((resolve, reject) => {
        router.get('/', (req) => {
          try {
            expect(req.query).toHaveProperty('key', 'value');
          } catch (e) {
            reject(e);
          }
          resolve();
        });
        testEngine.simulateNavigation('/?key=value');
      }));

    test('query param can be taken by "get" function', () =>
      new Promise((resolve, reject) => {
        router.get('/a', (req) => {
          try {
            expect(req.get('key')).toBe('value');
          } catch (e) {
            reject(e);
          }
          resolve();
        });
        testEngine.simulateNavigation('/a?key=value');
      }));

    test('can get multiple query params', () =>
      new Promise((resolve, reject) => {
        router.get('/a', (req) => {
          try {
            expect(req.query).toHaveProperty('a', 'b');
            expect(req.query).toHaveProperty('c', 'd');
          } catch (e) {
            reject(e);
          }
          resolve();
        });
        testEngine.simulateNavigation('/a/?a=b&c=d');
      }));

    test('params are decoded', () =>
      new Promise((resolve, reject) => {
        router.get('/', (req) => {
          try {
            expect(req.query).toHaveProperty('a?b', '&');
          } catch (e) {
            reject(e);
          }
          resolve();
        });
        testEngine.simulateNavigation(
          `/?${encodeURIComponent('a?b')}=${encodeURIComponent('&')}`,
        );
      }));

    test('return undefined if query param doesnt exist', () =>
      new Promise((resolve, reject) => {
        router.get('/aplace', (req) => {
          try {
            expect(req.query).toHaveProperty('another', undefined);
          } catch (e) {
            reject(e);
          }
          resolve();
        });
        testEngine.simulateNavigation('/aplace?a=b');
      }));

    test('with "get" return undefined if param doesnt exist', () =>
      new Promise((resolve, reject) => {
        router.get('/aplace', (req) => {
          try {
            expect(req.get('another')).toBeUndefined();
          } catch (e) {
            reject(e);
          }
          resolve();
        });
        testEngine.simulateNavigation('/aplace?a=b');
      }));
  });
});
