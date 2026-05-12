import * as React from 'react';
import {TS_Tabs} from '../../main/tabs/v1/TS_Tabs.js';

export default function EntryTabsV1() {
	return (
		<div data-testid="tabs-v1-container">
			<TS_Tabs tabs={[
				{uid: 'tab1', title: 'Tab 1', content: 'Content 1'},
				{uid: 'tab2', title: 'Tab 2', content: 'Content 2'},
				{uid: 'tab3', title: 'Tab 3', content: 'Content 3', disabled: true},
			]}/>
		</div>
	);
}
