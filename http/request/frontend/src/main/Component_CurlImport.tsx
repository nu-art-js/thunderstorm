/*
 * @nu-art/http-request-frontend — paste curl, fill the request
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {useState} from 'react';
import {parseCurl, type HttpRequestDef} from '@nu-art/http-request-shared';
import {Button, TS_PropRenderer, TS_TextArea} from '@nu-art/thunder-widgets';

type Props = {
	onParsed: (request: HttpRequestDef) => void;
};

export function Component_CurlImport(props: Props) {
	const [command, setCommand] = useState('');
	const [error, setError] = useState<string | undefined>();
	const build = () => {
		try {
			props.onParsed(parseCurl(command));
			setError(undefined);
		} catch (caught) {
			setError(caught instanceof Error ? caught.message : String(caught));
		}
	};
	return <TS_PropRenderer.Vertical label={'Curl'} error={error}>
		<TS_TextArea
			type={'text'}
			value={command}
			placeholder={'curl -X POST https://… -H "Authorization: Bearer …" -d "{}"'}
			onChange={setCommand}/>
		<Button variant={'secondary'} onClick={build}>Build request</Button>
	</TS_PropRenderer.Vertical>;
}
