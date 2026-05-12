import * as React from 'react';
import {Label} from '../../main/label/v3/index.js';

export default function EntryLabelV3() {
	return (
		<>
			<div data-testid="label-v3-container">
				<Label>Label v3 text</Label>
			</div>
			<div data-testid="label-v3-custom-class-container">
				<Label className="label-custom-class">Label v3 text</Label>
			</div>
		</>
	);
}
