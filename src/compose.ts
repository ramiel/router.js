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
    return (arg: any) => arg; // eslint-disable-line @typescript-eslint/no-explicit-any
  }

  if (funcs.length === 1) {
    return funcs[0];
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return funcs.reduce((a, b) => (...args: any) => a(b(...args)));
}

const noop = () => {};
export const pipe = (...funcs: Function[]): Function => {
  return compose(...funcs)(noop);
};

export default compose;
