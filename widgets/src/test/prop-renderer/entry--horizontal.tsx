import * as React from 'react';
import {TS_PropRenderer} from '../../main/prop-renderer/v1/TS_PropRenderer.js';

export default function EntryPropRendererHorizontal() {
	return (
		<div data-testid="prop-renderer-horizontal-container">
			<TS_PropRenderer.Horizontal label="Horizontal Label">
				<span>Child</span>
			</TS_PropRenderer.Horizontal>
		</div>
	);
}
