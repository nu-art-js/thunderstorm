/*
 * @nu-art/http-request-shared — {{key}} and {{secret:name}} slots
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {StringMap} from '@nu-art/ts-common';

const ParamToken = /\{\{(?!secret:)([A-Za-z_][A-Za-z0-9_-]*)\}\}/g;
const SecretToken = /\{\{secret:([A-Za-z0-9._-]+)\}\}/g;

/** Escape a value so it can be inserted inside a JSON string. */
export const jsonStringContent = (value: string): string =>
	JSON.stringify(value).slice(1, -1);

const unique = (names: string[]): string[] => {
	const seen = new Set<string>();
	const ordered: string[] = [];
	for (const name of names) {
		if (seen.has(name))
			continue;
		seen.add(name);
		ordered.push(name);
	}
	return ordered;
};

export const listParamNames = (text: string): string[] =>
	unique([...text.matchAll(ParamToken)].map(match => match[1]));

export const listSecretNames = (text: string): string[] =>
	unique([...text.matchAll(SecretToken)].map(match => match[1]));

export const applyParamMap = (text: string, params: StringMap): {text: string; missing: string[]} => {
	const missing = listParamNames(text).filter(name => params[name] === undefined);
	let next = text;
	for (const name of Object.keys(params))
		next = next.split(`{{${name}}}`).join(jsonStringContent(params[name]));
	return {text: next, missing};
};

export const applySecretMap = (text: string, secrets: StringMap): string => {
	let next = text;
	for (const name of Object.keys(secrets))
		next = next.split(`{{secret:${name}}}`).join(jsonStringContent(secrets[name]));
	return next;
};
