import * as React from 'react';
import {TS_Checkbox} from '../../main/checkbox/v3/index.js';

export default function EntryCheckboxV3() {
	const [checked, setChecked] = React.useState(false);
	return (
		<div data-testid="checkbox-v3-container">
			<TS_Checkbox checked={checked} onCheck={setChecked} label="Checkbox v3" id="checkbox-v3"/>
		</div>
	);
}
