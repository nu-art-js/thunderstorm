import * as React from 'react';
import {TS_Tabs as TS_TabsV1} from '../v1/TS_Tabs.js';

export function TS_Tabs(props: React.ComponentProps<typeof TS_TabsV1>): React.ReactElement {
	return <TS_TabsV1 {...props}/>;
}
