/*
 * @nu-art/http-request-frontend — one line per part of a stored request
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {emptyHttpRequest, httpRequestMethodAllowsBody, type HttpRequestDef} from '@nu-art/http-request-shared';
import {Button, LL_H_C, LL_V_L} from '@nu-art/thunder-widgets';
import {TS_Icons} from '@nu-art/ts-styles';
import {Component_HttpRequestLine} from './Component_HttpRequestLine.js';
import {Dialog_CurlImport} from './Dialog_CurlImport.js';
import {Dialog_HttpRequestPart, type HttpRequestPart} from './Dialog_HttpRequestPart.js';
import './http-request-editor.scss';

type Props = {
	value?: HttpRequestDef;
	onChange: (request: HttpRequestDef) => void;
	onCommit?: (request: HttpRequestDef) => void;
};

export function Component_HttpRequestEditor(props: Props) {
	const request = props.value ?? emptyHttpRequest();
	const commit = (next: HttpRequestDef) => {
		props.onChange(next);
		props.onCommit?.(next);
	};
	const savePart = (part: HttpRequestPart) => {
		if (part.kind === 'method') {
			commit({
				...request,
				method: part.method,
				...(httpRequestMethodAllowsBody(part.method) ? {} : {body: undefined}),
			});
			return;
		}
		if (part.kind === 'url') {
			commit({...request, url: part.url.trim()});
			return;
		}
		if (part.kind === 'body') {
			commit({...request, body: part.body});
			return;
		}
		const headers = {...(request.headers ?? {})};
		if (part.originalName && part.originalName !== part.name)
			delete headers[part.originalName];
		headers[part.name] = part.value;
		commit({...request, headers});
	};
	const headers = Object.entries(request.headers ?? {});
	return <LL_V_L className={'http-request-editor'}>
		<LL_H_C className={'http-request-editor__tools'}>
			<Button
				variant={'text'}
				className={'http-request-editor__icon'}
				aria-label={'Import curl'}
				title={'Import curl'}
				onClick={() => Dialog_CurlImport.show(commit)}>
				<TS_Icons.download.component/>
			</Button>
		</LL_H_C>
		<Component_HttpRequestLine
			label={'Method'}
			value={request.method}
			onOpen={() => Dialog_HttpRequestPart.show({kind: 'method', method: request.method}, savePart)}/>
		<Component_HttpRequestLine
			label={'URL'}
			value={request.url}
			onOpen={() => Dialog_HttpRequestPart.show({kind: 'url', url: request.url}, savePart)}/>
		{headers.map(([name, value]) => <Component_HttpRequestLine
			key={name}
			label={'Header'}
			value={`${name}: ${value}`}
			removeLabel={`Remove ${name}`}
			onOpen={() => Dialog_HttpRequestPart.show({kind: 'header', name, value, originalName: name}, savePart)}
			onRemove={() => {
				const next = {...(request.headers ?? {})};
				delete next[name];
				commit({...request, headers: next});
			}}/>)}
		<Component_HttpRequestLine
			label={'Header'}
			onOpen={() => Dialog_HttpRequestPart.show({kind: 'header', name: '', value: ''}, savePart)}/>
		{httpRequestMethodAllowsBody(request.method) && <Component_HttpRequestLine
			label={'Body'}
			value={request.body}
			onOpen={() => Dialog_HttpRequestPart.show({kind: 'body', method: request.method, body: request.body ?? ''}, savePart)}/>}
	</LL_V_L>;
}
