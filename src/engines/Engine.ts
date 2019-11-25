export type RouteHandler = (path: string) => void;

export interface Engine {
  /**
   * Execute any operation to startup the engine
   */
  setup: () => void;
  /**
   * Dispose anything instantiated by the engine
   */
  teardown: () => void;
  /**
   * Add an handler that must be called when a route match
   */
  addRouteChangeHandler: (handler: RouteHandler) => void;
  /**
   * Add an handler that must be called when leaving a route
   */
  addRouteExitHandler: (handler: RouteHandler) => void;
  /**
   * Go to the desired path
   */
  navigate: (path: string) => void;
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
   * Same as navigate, brings to the desired url but doesn't fire routes handlers
   */
  setLocation: (path: string) => void;
  /**
   * Execute the handlers for the given path or the current one.
   */
  run: (path?: string) => void;
}
