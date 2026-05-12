import * as React from 'react';
import {TS_Radio} from '../../main/radio/v3/TS_Radio.js';

export default function EntryRadioV3() {
	const [val, setVal] = React.useState<string | undefined>('a');
	return (
		<div data-testid="radio-v3-container">
			<TS_Radio values={['a', 'b']} groupName="r2" checked={val} onCheck={v => setVal(v)}/>
		</div>
	);
}
