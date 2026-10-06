/*
 * @nu-art/http-request-frontend — method field
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {SimpleListAdapter, TS_DropDown, TS_PropRenderer} from '@nu-art/thunder-widgets';
import {OutboundHttpMethods, type OutboundHttpMethod} from '@nu-art/http-request-shared';

type Props = {
	method: OutboundHttpMethod;
	onChange: (method: OutboundHttpMethod) => void;
};

const adapter = SimpleListAdapter([...OutboundHttpMethods], node => <div>{node.item}</div>);

export function Component_HttpRequestMethod(props: Props) {
	return <TS_PropRenderer.Vertical label={'Method'}>
		<TS_DropDown<OutboundHttpMethod>
			adapter={adapter}
			selected={props.method}
			onSelected={props.onChange}/>
	</TS_PropRenderer.Vertical>;
}
