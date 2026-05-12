import * as React from 'react';
import {TS_Toggle} from '../../main/toggle/v3/TS_Toggle.js';

export default function EntryToggleV3() {
	const [checked, setChecked] = React.useState(false);
	return (
		<div data-testid="toggle-v3-container">
			<TS_Toggle checked={checked} onCheck={setChecked}/>
		</div>
	);
}
