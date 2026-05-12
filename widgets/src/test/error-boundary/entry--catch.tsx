import * as React from 'react';
import {TS_ErrorBoundary} from '../../main/error-boundary/TS_ErrorBoundary.js';

function Thrower(): React.ReactElement {
	throw new Error('Test error');
}

export default function EntryErrorBoundaryCatch() {
	return (
		<div data-testid="error-boundary-catch-container">
			<TS_ErrorBoundary>
				<Thrower/>
			</TS_ErrorBoundary>
		</div>
	);
}
