import * as React from 'react';
import {Button} from '../../main/button/v3/index.js';

export default function EntryButtonV3Disabled() {
	return (
		<div data-testid="button-v3-disabled-container">
			<Button disabled onClick={() => {}}>Button v3 disabled</Button>
		</div>
	);
}
