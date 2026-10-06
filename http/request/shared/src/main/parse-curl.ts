/*
 * @nu-art/http-request-shared — paste a curl command into an HttpRequestDef
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HeaderKey_Authorization, HeaderKey_ContentType, HttpMethod} from '@nu-art/api-types';
import {MimeType_json, type StringMap} from '@nu-art/ts-common';
import {asHttpRequestDef} from './validate.js';
import type {HttpRequestDef, OutboundHttpMethod} from './types.js';

const IgnoredFlags = new Set([
	'-s', '--silent', '-S', '--show-error', '-L', '--location', '-k', '--insecure',
	'--compressed', '-i', '--include', '-v', '--verbose', '-f', '--fail',
]);

/** Letters inside a cluster such as `-fsSL`. Only flags that take no value. */
const IgnoredShorts = new Set(['s', 'S', 'L', 'k', 'i', 'v', 'f']);

const isIgnoredCluster = (token: string): boolean =>
	/^-[a-zA-Z]+$/.test(token) && [...token.slice(1)].every(letter => IgnoredShorts.has(letter));

const MethodFlags = new Set(['-X', '--request']);
const HeaderFlags = new Set(['-H', '--header']);
const DataFlags = new Set(['-d', '--data', '--data-raw', '--data-binary', '--data-ascii']);
const UrlFlags = new Set(['--url']);
const UserFlags = new Set(['-u', '--user']);

const tokenize = (input: string): string[] => {
	const text = input.replace(/\\\r?\n/g, ' ').trim();
	const tokens: string[] = [];
	let index = 0;
	while (index < text.length) {
		while (index < text.length && /\s/.test(text[index]))
			index++;
		if (index >= text.length)
			break;
		const quote = text[index] === '"' || text[index] === "'" ? text[index] : '';
		if (quote) {
			index++;
			let value = '';
			while (index < text.length && text[index] !== quote) {
				if (text[index] === '\\' && quote === '"') {
					index++;
					value += text[index] ?? '';
				} else
					value += text[index];
				index++;
			}
			if (text[index] !== quote)
				throw new Error('Curl command has an unclosed quote');
			index++;
			tokens.push(value);
			continue;
		}
		let value = '';
		while (index < text.length && !/\s/.test(text[index]))
			value += text[index++];
		tokens.push(value);
	}
	return tokens;
};

const flagAndValue = (token: string): {flag: string; inline?: string} => {
	const eq = token.indexOf('=');
	if (token.startsWith('--') && eq > 2)
		return {flag: token.slice(0, eq), inline: token.slice(eq + 1)};
	return {flag: token};
};

const takeValue = (tokens: string[], index: number, inline: string | undefined, flag: string): {value: string; next: number} => {
	if (inline !== undefined)
		return {value: inline, next: index};
	const value = tokens[index];
	if (value === undefined)
		throw new Error(`Curl flag ${flag} needs a value`);
	return {value, next: index + 1};
};

const encodeBasic = (user: string): string => {
	const bytes = new TextEncoder().encode(user);
	let binary = '';
	for (const byte of bytes)
		binary += String.fromCharCode(byte);
	return btoa(binary);
};

const asMethod = (value: string): OutboundHttpMethod => {
	const method = value.toLowerCase();
	if (method === HttpMethod.GET || method === HttpMethod.POST || method === HttpMethod.PUT
		|| method === HttpMethod.PATCH || method === HttpMethod.DELETE || method === HttpMethod.HEAD
		|| method === HttpMethod.OPTIONS)
		return method;
	throw new Error(`Unsupported curl method: ${value}`);
};

/** Build an HttpRequestDef from a curl command. Does not call the network. */
export const parseCurl = (command: string): HttpRequestDef => {
	const tokens = tokenize(command);
	if (tokens[0] === 'curl')
		tokens.shift();
	if (!tokens.length)
		throw new Error('Paste a curl command');

	let method: OutboundHttpMethod | undefined;
	let url = '';
	const headers: StringMap = {};
	const data: string[] = [];

	for (let index = 0; index < tokens.length;) {
		const token = tokens[index];
		const {flag, inline} = flagAndValue(token);
		if (IgnoredFlags.has(flag) || isIgnoredCluster(token)) {
			index++;
			continue;
		}
		if (MethodFlags.has(flag)) {
			const taken = takeValue(tokens, index + 1, inline, flag);
			method = asMethod(taken.value);
			index = taken.next;
			continue;
		}
		if (HeaderFlags.has(flag)) {
			const taken = takeValue(tokens, index + 1, inline, flag);
			const split = taken.value.indexOf(':');
			if (split < 1)
				throw new Error(`Curl header must look like Name: value`);
			headers[taken.value.slice(0, split).trim()] = taken.value.slice(split + 1).trim();
			index = taken.next;
			continue;
		}
		if (DataFlags.has(flag)) {
			const taken = takeValue(tokens, index + 1, inline, flag);
			data.push(taken.value);
			index = taken.next;
			continue;
		}
		if (UrlFlags.has(flag)) {
			const taken = takeValue(tokens, index + 1, inline, flag);
			url = taken.value;
			index = taken.next;
			continue;
		}
		if (UserFlags.has(flag)) {
			const taken = takeValue(tokens, index + 1, inline, flag);
			headers[HeaderKey_Authorization] = `Basic ${encodeBasic(taken.value)}`;
			index = taken.next;
			continue;
		}
		if (token.startsWith('-'))
			throw new Error(`Unsupported curl flag: ${flag}`);
		if (url)
			throw new Error('Curl command has more than one URL');
		url = token;
		index++;
	}

	if (!url)
		throw new Error('Curl command has no URL');

	const body = data.length ? data.join('&') : undefined;
	const resolvedMethod = method ?? (body !== undefined ? HttpMethod.POST : HttpMethod.GET);
	if (body !== undefined && !headers[HeaderKey_ContentType] && !headers['content-type'])
		headers[HeaderKey_ContentType] = body.trim().startsWith('{') || body.trim().startsWith('[')
			? MimeType_json
			: 'application/x-www-form-urlencoded';

	return asHttpRequestDef({
		method: resolvedMethod,
		url,
		...(Object.keys(headers).length ? {headers} : {}),
		...(body !== undefined ? {body} : {}),
	});
};
