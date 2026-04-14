import * as React from 'react';
import {TS_Radio as TS_RadioV1, Props as Props_Radio} from '../v1/index.js';

export function TS_Radio<ItemType>(props: Props_Radio<ItemType>): React.ReactElement {
	return <TS_RadioV1<ItemType> {...props}/>;
}
