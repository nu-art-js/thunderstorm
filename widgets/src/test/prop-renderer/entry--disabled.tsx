import * as React from 'react';
import {TS_PropRenderer} from '../../main/prop-renderer/v1/TS_PropRenderer.js';

export default function EntryPropRendererDisabled() {
	return (
		<div data-testid="prop-renderer-disabled-container">
			<TS_PropRenderer.Vertical label="Disabled Label" disabled>
				<span>Child</span>
			</TS_PropRenderer.Vertical>
		</div>
	);
}
