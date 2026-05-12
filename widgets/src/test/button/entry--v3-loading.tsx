import * as React from 'react';
import {Button} from '../../main/button/v3/index.js';

export default function EntryButtonV3Loading() {
	return (
		<div data-testid="button-v3-loading-container">
			<Button actionInProgress={true} onClick={() => {}}>Button v3 loading</Button>
		</div>
	);
}
