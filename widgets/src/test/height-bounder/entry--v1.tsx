import * as React from 'react';
import {HeightBounder} from '../../main/components/HeightBounder.js';

export default function EntryHeightBounderV1() {
	return (
		<div data-testid="height-bounder-container">
			<HeightBounder>
				<span>Height bounded content</span>
			</HeightBounder>
		</div>
	);
}
