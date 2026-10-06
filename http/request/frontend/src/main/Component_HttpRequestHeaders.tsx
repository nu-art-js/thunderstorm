/*
 * @nu-art/http-request-frontend — header list
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import type {StringMap} from '@nu-art/ts-common';
import {Button} from '@nu-art/thunder-widgets';
import {Component_HttpRequestHeader, type HttpRequestHeaderRow} from './Component_HttpRequestHeader.js';

type Props = {
	headers?: StringMap;
	onChange: (headers: StringMap) => void;
	onCommit?: (headers: StringMap) => void;
};

let rowSeq = 0;

const rowsFrom = (headers: StringMap | undefined): (HttpRequestHeaderRow & {id: string})[] =>
	Object.entries(headers ?? {}).map(([name, value]) => ({id: `saved:${name}`, name, value}));

const toMap = (rows: HttpRequestHeaderRow[]): StringMap => {
	const headers: StringMap = {};
	for (const row of rows) {
		const name = row.name.trim();
		if (name)
			headers[name] = row.value;
	}
	return headers;
};

export function Component_HttpRequestHeaders(props: Props) {
	const [rows, setRows] = useState(() => rowsFrom(props.headers));
	const emit = (next: (HttpRequestHeaderRow & {id: string})[], persist: boolean) => {
		setRows(next);
		const headers = toMap(next);
		props.onChange(headers);
		if (persist)
			props.onCommit?.(headers);
	};
	return <div className={'http-request-headers'}>
		{rows.map((row, index) => <Component_HttpRequestHeader
			key={row.id}
			name={row.name}
			value={row.value}
			onChange={updated => emit(rows.map((item, itemIndex) => itemIndex === index ? {...item, ...updated} : item), false)}
			onBlur={updated => emit(rows.map((item, itemIndex) => itemIndex === index ? {...item, ...updated} : item), true)}
			onRemove={() => emit(rows.filter((_, itemIndex) => itemIndex !== index), true)}/>)}
		<Button
			variant={'secondary'}
			onClick={() => emit([...rows, {id: `row-${++rowSeq}`, name: '', value: ''}], true)}>
			Add header
		</Button>
	</div>;
}
