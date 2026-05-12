import * as React from 'react';
import {TS_ComponentTransition} from '../../main/component-transition/v3/TS_ComponentTransition.js';

export default function EntryComponentTransitionV3Visible() {
	return (
		<div data-testid="component-transition-v3-container">
			<TS_ComponentTransition trigger={true} transitionTimeout={0}>
				<span>Transition v3</span>
			</TS_ComponentTransition>
		</div>
	);
}
