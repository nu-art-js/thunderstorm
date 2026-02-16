# HeaderKey class (backend)

## Problem

Backend code that uses the `HeaderKey` class from `@nu-art/thunderstorm-backend` (to read and validate request headers with an optional processor and response code) cannot migrate off thunderstorm-backend without a replacement.

## How to migrate

**Do not** import `HeaderKey` from `@nu-art/thunderstorm-backend`.

**Option A — Shallow-copy the class into your backend package (recommended):**

The `HeaderKey` class is small: it holds a header name, an optional HTTP status code (default 400), and an optional processor `(value: string) => string`. It reads the header via `MemKey_HttpRequest.get().header(this.key)` and applies the processor. Copy this class into your backend (e.g. under `_entity/session/HeaderKey.ts` or next to consts) and use `MemKey_HttpRequest` from `@nu-art/http-server`:

```ts
import {MemKey_HttpRequest} from '@nu-art/http-server';
import {ApiException} from '@nu-art/ts-common';

export class HeaderKey {
	private readonly key: string;
	private readonly responseCode: number;
	private processor = (value: string) => value;

	constructor(key: string, responseCode: number = 400) {
		this.key = key.toLowerCase();
		this.responseCode = responseCode;
	}

	get(): string {
		const req = MemKey_HttpRequest.get();
		const value = req.header ? req.header(this.key) : (req as any).get?.(this.key);
		if (!value)
			throw new ApiException(this.responseCode, `Missing expected header: ${this.key}`);
		return this.processor(value);
	}

	setProcessor(processor: (value: string) => string): this {
		this.processor = processor;
		return this;
	}
}
```

Express request exposes `.get(name)` or `.header(name)`; use whichever your http-server request type provides (Express uses `req.get()`).

**Option B — Use a shared infra package:** If the project adds `HeaderKey` to `@nu-art/http-server`, import from there instead.

## Example

User-account-backend added `_entity/session/HeaderKey.ts` with the shallow copy above and imports `MemKey_HttpRequest` from `@nu-art/http-server`. Session consts import this local `HeaderKey` and the header name constants from user-account-shared.
