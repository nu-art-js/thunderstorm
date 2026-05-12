import * as React from 'react';
import {TS_PropRenderer} from '../../main/prop-renderer/v1/TS_PropRenderer.js';

export default function EntryPropRendererFlat() {
	return (
		<div data-testid="prop-renderer-flat-container">
			<TS_PropRenderer.Flat label="Flat Label">
				<span>Child</span>
			</TS_PropRenderer.Flat>
		</div>
	);
}
