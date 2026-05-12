import * as React from 'react';
import {TS_PropRenderer} from '../../main/prop-renderer/v1/TS_PropRenderer.js';

export default function EntryPropRendererVertical() {
	return (
		<div data-testid="prop-renderer-vertical-container">
			<TS_PropRenderer.Vertical label="Vertical Label">
				<span>Child</span>
			</TS_PropRenderer.Vertical>
		</div>
	);
}
