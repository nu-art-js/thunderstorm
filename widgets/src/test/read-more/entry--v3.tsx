import * as React from 'react';
import {TS_ReadMore} from '../../main/read-more/v3/TS_ReadMore.js';

const LONG_TEXT = 'This is a long paragraph that should overflow the collapsed height so that the Read More and Read Less controls are visible. It contains multiple sentences to ensure the component has enough content to truncate. Keep adding more text until the read more link appears.';

export default function EntryReadMoreV3() {
	return (
		<div data-testid="read-more-v3-container">
			<TS_ReadMore text={LONG_TEXT} collapsedHeight={40}/>
		</div>
	);
}
