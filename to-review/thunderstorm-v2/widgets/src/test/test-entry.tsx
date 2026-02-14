/*
 * Thunder Widgets – Test entry for Playwright.
 * Renders Input v1, v2, v3 for the same-scenario test suite.
 */
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {TS_Input} from '../main/input/v1/index.js';
import {TS_InputV2} from '../main/input/v2/index.js';
import {TS_InputV3} from '../main/input/v3/index.js';

function TestApp() {
	return (
		<div id="input-test-app">
			<div data-testid="input-v1-container">
				<label htmlFor="input-v1">Input v1</label>
				<TS_Input id="input-v1" type="text" placeholder="v1"/>
			</div>
			<div data-testid="input-v2-container">
				<label htmlFor="input-v2">Input v2</label>
				<TS_InputV2 id="input-v2" type="text" placeholder="v2"/>
			</div>
			<div data-testid="input-v3-container">
				<label htmlFor="input-v3">Input v3</label>
				<TS_InputV3 id="input-v3" type="text" placeholder="v3"/>
			</div>
		</div>
	);
}

const root = document.getElementById('root');
if (root) {
	createRoot(root).render(<TestApp/>);
}

declare global {
	interface Window {
		WidgetsTestReady?: boolean;
	}
}
window.WidgetsTestReady = true;

export {TS_Input, TS_InputV2, TS_InputV3};
