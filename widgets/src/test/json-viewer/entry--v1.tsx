import * as React from 'react';
import {TS_JSONViewer} from '../../main/json-viewer/v1/TS_JSONViewer.js';

export default function EntryJSONViewerV1() {
	return (
		<div data-testid="json-viewer-v1-container">
			<TS_JSONViewer item={{a: 1, b: {c: 2}, _private: 'hidden'}}/>
		</div>
	);
}
