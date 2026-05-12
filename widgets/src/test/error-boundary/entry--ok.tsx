import * as React from 'react';
import {TS_ErrorBoundary} from '../../main/error-boundary/TS_ErrorBoundary.js';

export default function EntryErrorBoundaryOk() {
	return (
		<div data-testid="error-boundary-ok-container">
			<TS_ErrorBoundary>
				<span>No error</span>
			</TS_ErrorBoundary>
		</div>
	);
}
