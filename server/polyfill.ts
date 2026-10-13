/**
 * Universal Serverless Runtime Polyfill
 * Ensures global WebSocket is safely mocked in Node 20 and serverless lambdas.
 */

export class MockWebSocket {
  static readonly CONNECTING = 0;
  static readonly OPEN = 1;
  static readonly CLOSING = 2;
  static readonly CLOSED = 3;
  readonly CONNECTING = 0;
  readonly OPEN = 1;
  readonly CLOSING = 2;
  readonly CLOSED = 3;
  readyState = 3;
  url = '';
  onopen = null;
  onclose = null;
  onerror = null;
  onmessage = null;

  constructor(url?: string) {
    this.url = url || '';
  }

  close() {}
  send() {}
  addEventListener() {}
  removeEventListener() {}
  dispatchEvent() {
    return true;
  }
}

if (typeof globalThis.WebSocket === 'undefined') {
  globalThis.WebSocket = MockWebSocket as any;
}
