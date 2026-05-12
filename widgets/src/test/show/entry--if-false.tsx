import * as React from 'react';
import {Show} from '../../main/components/Show.js';

export default function EntryShowIfFalse() {
	return (
		<div data-testid="show-if-false-container">
			<Show>
				<Show.If condition={false}><span>Show when false</span></Show.If>
				<Show.Else><span>Else content</span></Show.Else>
			</Show>
		</div>
	);
}
