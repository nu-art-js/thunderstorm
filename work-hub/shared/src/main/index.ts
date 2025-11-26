import {ReactNode} from 'react';

export type WorkHubTab = {
	id: string;
	label: string;
	content: () => ReactNode,
};