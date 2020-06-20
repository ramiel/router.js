/* eslint-disable import/no-extraneous-dependencies */
import { EventEmitter } from 'events';
import { LocationMock } from '@jedmao/location';

class WindowMock extends EventEmitter {
  public addEventListener = jest.fn(
    (ev: string, listener: (...args: unknown[]) => void) => {
      return this.addListener(ev, listener);
    },
  );

  public removeEventListener = jest.fn(
    (ev: string, listener: (...args: unknown[]) => void) => {
      return this.removeListener(ev, listener);
    },
  );

  public location = new LocationMock('http://routerjs.com');

  public history = {
    pushState: () => {},
  };

  public mockClear() {
    this.addEventListener.mockClear();
  }
}

export default WindowMock;
