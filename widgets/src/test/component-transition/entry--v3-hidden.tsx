import * as React from 'react';
import {TS_ComponentTransition} from '../../main/component-transition/v3/TS_ComponentTransition.js';

export default function EntryComponentTransitionV3Hidden() {
	return (
		<div data-testid="component-transition-v3-hidden-container">
			<TS_ComponentTransition trigger={false} transitionTimeout={0}>
				<span>Transition v3 hidden</span>
			</TS_ComponentTransition>
		</div>
	);
}
