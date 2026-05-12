import * as React from 'react';
import {TS_ProgressBar} from '../../main/loaders/TS_ProgressBar.js';

export default function EntryProgressBarV1() {
	return (
		<div data-testid="loader-progress-container">
			<TS_ProgressBar ratios={[0.3, 0.5]} type="linear-bar"/>
		</div>
	);
}
