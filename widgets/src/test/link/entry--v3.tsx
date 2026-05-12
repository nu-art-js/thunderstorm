import * as React from 'react';
import {TS_Link} from '../../main/link/v3/TS_Link.js';

export default function EntryLinkV3() {
	return (
		<div data-testid="link-v3-container">
			<TS_Link url="/test">Link v3</TS_Link>
		</div>
	);
}
