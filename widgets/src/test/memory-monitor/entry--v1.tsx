import * as React from 'react';
import {TS_MemoryMonitor} from '../../main/_utils/TS_MemoryMonitor/TS_MemoryMonitor.js';

export default function EntryMemoryMonitorV1() {
	return (
		<div data-testid="memory-monitor-container">
			<TS_MemoryMonitor labelResolver={() => 'test-env-1.0.0'}/>
		</div>
	);
}
