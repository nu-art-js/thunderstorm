/*
 * @nu-art/http-request-frontend — url field
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {TS_Input, TS_PropRenderer} from '@nu-art/thunder-widgets';

type Props = {
	url: string;
	onChange: (url: string) => void;
	onBlur?: (url: string) => void;
};

export function Component_HttpRequestUrl(props: Props) {
	return <TS_PropRenderer.Vertical label={'URL'}>
		<TS_Input
			type={'text'}
			value={props.url}
			placeholder={'https://…'}
			onChange={props.onChange}
			onBlur={props.onBlur}/>
	</TS_PropRenderer.Vertical>;
}
