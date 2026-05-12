import * as React from 'react';
import {TS_ButtonGroup} from '../../main/button-group/TS_ButtonGroup.js';

export default function EntryButtonGroupVertical() {
	const [selectedKey, setSelectedKey] = React.useState<string | undefined>(undefined);
	return (
		<div data-testid="button-group-vertical-container">
			<TS_ButtonGroup
				direction="vertical"
				controlled={true}
				buttons={[
					{key: 'up', label: 'Up'},
					{key: 'down', label: 'Down'},
				]}
				selectedKey={selectedKey}
				clickCallback={(key) => setSelectedKey(key)}
			/>
		</div>
	);
}
