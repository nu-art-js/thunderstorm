/*
 * @nu-art/http-request-frontend — composes the request fields
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {emptyHttpRequest, httpRequestMethodAllowsBody, type HttpRequestDef} from '@nu-art/http-request-shared';
import {LL_V_L} from '@nu-art/thunder-widgets';
import {Component_CurlImport} from './Component_CurlImport.js';
import {Component_HttpRequestBody} from './Component_HttpRequestBody.js';
import {Component_HttpRequestHeaders} from './Component_HttpRequestHeaders.js';
import {Component_HttpRequestMethod} from './Component_HttpRequestMethod.js';
import {Component_HttpRequestUrl} from './Component_HttpRequestUrl.js';
import './http-request-editor.scss';

type Props = {
	value?: HttpRequestDef;
	onChange: (request: HttpRequestDef) => void;
	onCommit?: (request: HttpRequestDef) => void;
};

export function Component_HttpRequestEditor(props: Props) {
	const [curlStamp, setCurlStamp] = useState(0);
	const request = props.value ?? emptyHttpRequest();
	const patch = (next: Partial<HttpRequestDef>) => props.onChange({...request, ...next});
	const commit = (next: Partial<HttpRequestDef>) => {
		const updated = {...request, ...next};
		props.onChange(updated);
		props.onCommit?.(updated);
	};
	return <LL_V_L className={'http-request-editor'}>
		<Component_CurlImport onParsed={parsed => {
			setCurlStamp(stamp => stamp + 1);
			props.onChange(parsed);
			props.onCommit?.(parsed);
		}}/>
		<Component_HttpRequestMethod
			method={request.method}
			onChange={method => commit({
				method,
				...(httpRequestMethodAllowsBody(method) ? {} : {body: undefined}),
			})}/>
		<Component_HttpRequestUrl
			url={request.url}
			onChange={url => patch({url})}
			onBlur={url => props.onCommit?.({...request, url})}/>
		<Component_HttpRequestHeaders
			key={curlStamp}
			headers={request.headers}
			onChange={headers => patch({headers})}
			onCommit={headers => props.onCommit?.({...request, headers})}/>
		<Component_HttpRequestBody
			method={request.method}
			body={request.body}
			onChange={body => patch({body})}
			onBlur={body => props.onCommit?.({...request, body})}/>
	</LL_V_L>;
}
