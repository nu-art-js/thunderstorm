import * as React from 'react';
import {TS_ButtonGroup} from '../../main/button-group/TS_ButtonGroup.js';

export default function EntryButtonGroupHorizontal() {
	return (
		<div data-testid="button-group-horizontal-container">
			<TS_ButtonGroup
				direction="horizontal"
				controlled={undefined}
				buttons={[
					{key: 'left', label: 'Left', onClick: () => {}},
					{key: 'right', label: 'Right', onClick: () => {}},
				]}
				defaultButtonKey="left"
			/>
		</div>
	);
}
