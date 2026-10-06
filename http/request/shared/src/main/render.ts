/*
 * @nu-art/http-request-shared — fill {{key}} and leave {{secret:name}} in place
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpCodes} from '@nu-art/api-types';
import type {StringMap} from '@nu-art/ts-common';
import {applyParamMap} from './substitute.js';
import type {HttpRequestDef} from './types.js';
import {asHttpRequestDef, validateRenderedUrl} from './validate.js';

/**
 * Stringify the stored request, insert the caller map, and parse it back.
 * Secret slots stay as `{{secret:name}}`. A missing `{{key}}` is 412.
 */
export const renderHttpRequest = (request: HttpRequestDef, params: StringMap): HttpRequestDef => {
	const stored = asHttpRequestDef(request);
	const applied = applyParamMap(JSON.stringify(stored), params);
	if (applied.missing.length)
		throw HttpCodes._4XX.PRECONDITION_FAILED(`Missing data: ${applied.missing.join(', ')}`);

	let parsed: unknown;
	try {
		parsed = JSON.parse(applied.text);
	} catch {
		throw HttpCodes._4XX.BAD_REQUEST('Request template is not valid JSON after substitution');
	}

	const rendered = asHttpRequestDef(parsed);
	const urlError = validateRenderedUrl(rendered.url);
	if (urlError)
		throw HttpCodes._4XX.BAD_REQUEST(urlError);
	return rendered;
};
