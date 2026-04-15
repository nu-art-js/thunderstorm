import * as React from 'react';
import {TS_ReadMore as TS_ReadMoreV1} from '../v1/TS_ReadMore.js';

type Props = {
	text: string;
	collapsedHeight: number;
	readMoreText?: (showingMore: boolean) => string;
};

export function TS_ReadMore(props: Props): React.ReactElement {
	return <TS_ReadMoreV1 {...props}/>;
}
