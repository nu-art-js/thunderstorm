import * as React from 'react';
import {TS_CircularLoader} from '../../main/loaders/TS_CircularLoader.js';

export default function EntryCircularLoaderV1() {
	return (
		<div data-testid="loader-circular-container">
			<TS_CircularLoader/>
		</div>
	);
}
