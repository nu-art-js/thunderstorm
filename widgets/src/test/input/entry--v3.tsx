import * as React from 'react';
import {TS_Input} from '../../main/input/v3/index.js';

export default function EntryInputV3() {
	return (
		<div data-testid="input-v3-container">
			<label htmlFor="input-v3">Input v3</label>
			<TS_Input id="input-v3" type="text" placeholder="v3"/>
		</div>
	);
}
