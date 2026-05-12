import * as React from 'react';
import {TS_VirtualizedList} from '../../main/virtualized-list/v1/TS_VirtualizedList.js';

const items = Array.from({length: 150}, (_, i) => <span key={i}>Item {i}</span>);

export default function EntryVirtualizedListV1() {
	return (
		<div data-testid="virtualized-list-container" style={{height: 200}}>
			<TS_VirtualizedList listToRender={items} itemHeight={24}/>
		</div>
	);
}
