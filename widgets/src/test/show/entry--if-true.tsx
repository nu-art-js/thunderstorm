import * as React from 'react';
import {Show} from '../../main/components/Show.js';

export default function EntryShowIfTrue() {
	return (
		<div data-testid="show-if-true-container">
			<Show>
				<Show.If condition={true}><span>Show when true</span></Show.If>
				<Show.Else><span>Else</span></Show.Else>
			</Show>
		</div>
	);
}
