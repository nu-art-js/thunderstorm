/*
 * @nu-art/user-account-backend - Shallow copy of HeaderKey for request header access
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiException} from '@nu-art/ts-common';
import {MemKey_HttpRequest} from './consts.js';

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
		const value = req.header(this.key);
		if (!value)
			throw new ApiException(this.responseCode, `Missing expected header: ${this.key}`);

		return this.processor(value);
	}

	setProcessor(processor: (value: string) => string): this {
		this.processor = processor;
		return this;
	}
}
