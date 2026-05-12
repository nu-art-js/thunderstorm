import * as React from 'react';
import {TS_CollapsableContainer} from '../../main/collapsable-container/v3/index.js';

export default function EntryCollapsableV3() {
	return (
		<div data-testid="collapsable-v3-container">
			<TS_CollapsableContainer
				headerRenderer="Header v3"
				containerRenderer="Content v3"
				initialCollapsed={false}
			/>
		</div>
	);
}
