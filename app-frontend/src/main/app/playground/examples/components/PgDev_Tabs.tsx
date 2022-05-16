import * as React from 'react';
import {AppPage, Tab, TS_Tabs} from '@nu-art/thunderstorm/frontend';

const tabs: Tab[] = [
	{
		uid: '0',
		content: <div>Static Content</div>,
		title: 'String Title',
	}, {
		uid: '1',
		content: <div>Static Content</div>,
		title: <div>Static Title</div>,
	},
	{
		uid: '2',
		content: async () => <div>Dynamic Content</div>,
		title: <div>Static Title</div>,
	},
	{
		uid: '3',
		content: async () => <div>Dynamic Content</div>,
		title: async () => <div>Dynamic Title</div>,
	}
];

class Pg_Component
	extends AppPage {

	constructor(p: {}) {
		super(p, PgDev_Tabs.name);
	}

	protected deriveStateFromProps(nextProps: {}) {
		return {};
	}

	render() {
		return <TS_Tabs tabs={tabs}/>;
	}
}

export const PgDev_Tabs = {name: 'DevTool - Tabs', renderer: Pg_Component};
