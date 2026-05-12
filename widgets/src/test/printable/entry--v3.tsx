import * as React from 'react';
import {TS_Printable} from '../../main/printable/v3/TS_Printable.js';

export default function EntryPrintableV3() {
	return (
		<div data-testid="printable-v3-container">
			<TS_Printable printable={() => Promise.resolve()}>Printable v3</TS_Printable>
		</div>
	);
}
