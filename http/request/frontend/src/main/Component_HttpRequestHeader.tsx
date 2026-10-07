/*
 * @nu-art/http-request-frontend — one header row
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {HeaderKey_Authorization} from '@nu-art/api-types';
import {Button, LL_V_L, TS_Input, TS_PropRenderer} from '@nu-art/thunder-widgets';

export type HttpRequestHeaderRow = {
	name: string;
	value: string;
};

type Props = HttpRequestHeaderRow & {
	focus?: boolean;
	onChange: (row: HttpRequestHeaderRow) => void;
};

const rawBearer = (name: string, value: string): boolean =>
	name.trim().toLowerCase() === HeaderKey_Authorization.toLowerCase()
	&& /bearer\s+\S+/i.test(value)
	&& !value.includes('{{secret:');

export function Component_HttpRequestHeader(props: Props) {
	const [secretName, setSecretName] = useState('');
	const offerSecret = rawBearer(props.name, props.value);
	return <LL_V_L className={'http-request-header'}>
		<TS_PropRenderer.Horizontal label={'Name'}>
			<TS_Input
				type={'text'}
				value={props.name}
				focus={props.focus}
				placeholder={'Authorization'}
				onChange={name => props.onChange({name, value: props.value})}/>
		</TS_PropRenderer.Horizontal>
		<TS_PropRenderer.Horizontal label={'Value'}>
			<TS_Input
				type={'text'}
				value={props.value}
				placeholder={'Bearer …'}
				onChange={value => props.onChange({name: props.name, value})}/>
		</TS_PropRenderer.Horizontal>
		{offerSecret
			? <TS_PropRenderer.Horizontal label={'Secret name'}>
				<TS_Input
					type={'text'}
					value={secretName}
					placeholder={'cursor-implement-tasks'}
					onChange={setSecretName}/>
				<Button
					variant={'secondary'}
					disabled={!secretName.trim()}
					onClick={() => props.onChange({
						name: props.name,
						value: `Bearer {{secret:${secretName.trim()}}}`,
					})}>
					Use secret
				</Button>
			</TS_PropRenderer.Horizontal>
			: null}
	</LL_V_L>;
}
