import * as React from 'react';
import {TS_PropRenderer} from '../../main/prop-renderer/v1/TS_PropRenderer.js';

export default function EntryPropRendererError() {
	return (
		<div data-testid="prop-renderer-error-container">
			<TS_PropRenderer.Vertical label="Error Label" error="Error message">
				<span>Child</span>
			</TS_PropRenderer.Vertical>
		</div>
	);
}
