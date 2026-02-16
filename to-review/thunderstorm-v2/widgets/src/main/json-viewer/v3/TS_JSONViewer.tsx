import * as React from 'react';
import {TS_JSONViewer as TS_JSONViewerV1} from '../v1/index.js';

type Props = {
	item: Object;
	filterGeneratedFields?: boolean;
};

export function TS_JSONViewer(props: Props): React.ReactElement {
	return <TS_JSONViewerV1 {...props}/>;
}
