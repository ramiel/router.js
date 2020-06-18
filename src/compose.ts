/**
 * Borrowed from [redux project](https://github.com/reduxjs/redux)
 *
 * Composes single-argument functions from right to left. The rightmost
 * function can take multiple arguments as it provides the signature for
 * the resulting composite function.
 *
 * @param {...Function} funcs The functions to compose.
 * @returns {Function} A function obtained by composing the argument functions
 * from right to left. For example, compose(f, g, h) is identical to doing
 * (...args) => f(g(h(...args))).
 */
function compose(...funcs: Function[]): Function {
  if (funcs.length === 0) {
    return (arg: unknown) => arg;
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  return funcs.reduce((a, b) => (...args: unknown[]) => a(b(...args)));
}

const noop = () => {};
export const pipe = (...fns: Function[]) => compose(...fns)(noop);

export default compose;
