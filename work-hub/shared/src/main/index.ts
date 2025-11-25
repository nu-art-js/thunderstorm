import {ReactNode} from 'react';
import {DBPointer} from '@nu-art/ts-common';

export type WorkHubTab = {
	id: string;
	label: string;
	content: (dbPointer: DBPointer) => ReactNode,
};