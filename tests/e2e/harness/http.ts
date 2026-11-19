/**
 * Opaque-Box HTTP Helper
 *
 * Supports calling live server endpoints via standard fetch or invoking Next.js
 * App Router route handlers directly in-process with standard Request / NextRequest.
 */

import { assertEquals, assert, assertMatches } from './index';

export interface RequestOptions {
  method?: string;
  headers?: Record<string, string>;
  body?: any;
  searchParams?: Record<string, string | number>;
}

export class TestResponse {
  public raw: Response;
  public status: number;
  public statusText: string;
  public headers: Headers;
  public ok: boolean;
  private _textPromise?: Promise<string>;
  private _cachedText?: string;

  constructor(response: Response) {
    this.raw = response;
    this.status = response.status;
    this.statusText = response.statusText;
    this.headers = response.headers;
    this.ok = response.ok;
  }

  async text(): Promise<string> {
    if (this._cachedText !== undefined) {
      return this._cachedText;
    }
    if (!this._textPromise) {
      this._textPromise = this.raw.text();
    }
    this._cachedText = await this._textPromise;
    return this._cachedText;
  }

  async json<T = any>(): Promise<T> {
    const rawText = await this.text();
    try {
      return JSON.parse(rawText) as T;
    } catch (err: any) {
      throw new Error(`Failed to parse response body as JSON. Raw body: "${rawText}". Error: ${err.message}`);
    }
  }

  expectStatus(expected: number): this {
    assertEquals(this.status, expected, `HTTP status code mismatch`);
    return this;
  }

  expectOk(): this {
    assert(this.ok, `Expected HTTP response to be OK (2xx), but got status ${this.status}`);
    return this;
  }

  expectHeader(name: string, expectedVal?: string | RegExp): this {
    const headerVal = this.headers.get(name);
    assert(headerVal !== null, `Expected response header "${name}" to be present`);
    if (expectedVal !== undefined) {
      if (typeof expectedVal === 'string') {
        assertEquals(headerVal, expectedVal, `Header "${name}" value mismatch`);
      } else if (expectedVal instanceof RegExp) {
        assertMatches(headerVal, expectedVal, `Header "${name}" value does not match regex`);
      }
    }
    return this;
  }
}

/**
 * Build a standard Request object with proper headers and body
 */
export function createMockRequest(
  urlOrPath: string,
  options: RequestOptions = {},
  baseUrl: string = 'http://localhost:3000'
): Request {
  const fullUrl = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')
    ? new URL(urlOrPath)
    : new URL(urlOrPath, baseUrl);

  if (options.searchParams) {
    for (const [key, value] of Object.entries(options.searchParams)) {
      fullUrl.searchParams.set(key, String(value));
    }
  }

  const headers = new Headers(options.headers || {});
  let body: BodyInit | undefined = undefined;

  if (options.body !== undefined && options.method && !['GET', 'HEAD'].includes(options.method.toUpperCase())) {
    if (typeof options.body === 'string' || options.body instanceof Blob || options.body instanceof FormData) {
      body = options.body;
    } else {
      body = JSON.stringify(options.body);
      if (!headers.has('content-type')) {
        headers.set('content-type', 'application/json');
      }
    }
  }

  return new Request(fullUrl.toString(), {
    method: options.method || 'GET',
    headers,
    body,
  });
}

/**
 * Invoke a Next.js App Router route handler directly in-process
 */
export async function invokeRouteHandler(
  handler: (request: Request, context?: any) => Promise<Response> | Response,
  requestOrUrl: Request | string,
  optionsOrContext?: RequestOptions | any,
  context?: any
): Promise<TestResponse> {
  let req: Request;
  let ctx: any = context;

  if (typeof requestOrUrl === 'string') {
    const opts = (optionsOrContext && !optionsOrContext.params) ? optionsOrContext : {};
    ctx = (optionsOrContext && optionsOrContext.params) ? optionsOrContext : context;
    req = createMockRequest(requestOrUrl, opts);
  } else {
    req = requestOrUrl;
    ctx = optionsOrContext || context;
  }

  const response = await handler(req, ctx);
  return new TestResponse(response);
}

/**
 * Generic opaque-box HTTP Client
 */
export class HttpClient {
  private baseUrl: string;
  private defaultHeaders: Record<string, string>;

  constructor(options: { baseUrl?: string; defaultHeaders?: Record<string, string> } = {}) {
    this.baseUrl = options.baseUrl || process.env.TEST_BASE_URL || 'http://localhost:3000';
    this.defaultHeaders = options.defaultHeaders || {};
  }

  setBaseUrl(url: string): void {
    this.baseUrl = url;
  }

  getBaseUrl(): string {
    return this.baseUrl;
  }

  async fetch(urlOrPath: string, init: RequestInit = {}): Promise<TestResponse> {
    const fullUrl = urlOrPath.startsWith('http://') || urlOrPath.startsWith('https://')
      ? urlOrPath
      : new URL(urlOrPath, this.baseUrl).toString();

    const headers = new Headers(this.defaultHeaders);
    if (init.headers) {
      const initHeaders = new Headers(init.headers);
      initHeaders.forEach((val, key) => headers.set(key, val));
    }

    const response = await fetch(fullUrl, {
      ...init,
      headers,
    });

    return new TestResponse(response);
  }

  async get(urlOrPath: string, options: { headers?: Record<string, string>; searchParams?: Record<string, string | number> } = {}): Promise<TestResponse> {
    let url = urlOrPath;
    if (options.searchParams) {
      const u = url.startsWith('http') ? new URL(url) : new URL(url, this.baseUrl);
      for (const [k, v] of Object.entries(options.searchParams)) {
        u.searchParams.set(k, String(v));
      }
      url = url.startsWith('http') ? u.toString() : u.pathname + u.search;
    }
    return this.fetch(url, {
      method: 'GET',
      headers: options.headers,
    });
  }

  async post(urlOrPath: string, body?: any, options: { headers?: Record<string, string> } = {}): Promise<TestResponse> {
    let payloadBody: BodyInit | undefined;
    const headers = { ...options.headers };

    if (body !== undefined) {
      if (typeof body === 'string' || body instanceof FormData || body instanceof Blob) {
        payloadBody = body;
      } else {
        payloadBody = JSON.stringify(body);
        if (!headers['Content-Type'] && !headers['content-type']) {
          headers['Content-Type'] = 'application/json';
        }
      }
    }

    return this.fetch(urlOrPath, {
      method: 'POST',
      headers,
      body: payloadBody,
    });
  }
}

export const defaultHttpClient = new HttpClient();
