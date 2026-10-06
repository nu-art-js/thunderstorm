/*
 * @nu-art/http-request-frontend — body field
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TS_PropRenderer, TS_TextArea} from '@nu-art/thunder-widgets';
import {httpRequestMethodAllowsBody, type OutboundHttpMethod} from '@nu-art/http-request-shared';

type Props = {
	method: OutboundHttpMethod;
	body?: string;
	onChange: (body: string) => void;
	onBlur?: (body: string) => void;
};

export function Component_HttpRequestBody(props: Props) {
	if (!httpRequestMethodAllowsBody(props.method))
		return null;
	return <TS_PropRenderer.Vertical label={'Body'}>
		<TS_TextArea
			type={'text'}
			value={props.body ?? ''}
			placeholder={'{"version":"{{version}}"}'}
			onChange={props.onChange}
			onBlur={props.onBlur}/>
	</TS_PropRenderer.Vertical>;
}
