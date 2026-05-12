import {Thunder} from '@nu-art/thunder-core';
import * as React from 'react';
import {createRoot} from 'react-dom/client';

new Thunder({configUrl: '/test-config.json'});

declare global {
	interface Window {
		TestReady?: boolean;
	}
}

const entryModules = import.meta.glob<{ default: React.ComponentType }>('../**/entry--*.tsx');

const entry = new URLSearchParams(location.search).get('entry');
if (entry) {
	const key = `../${entry}.tsx`;
	const loader = entryModules[key];
	if (!loader) {
		document.body.textContent = `No entry found for "${entry}" (key: ${key}). Available: ${Object.keys(entryModules).join(', ')}`;
	} else {
		loader().then(mod => {
			const Component = mod.default;
			const root = createRoot(document.getElementById('root')!);
			root.render(<Component/>);
			window.TestReady = true;
		}).catch(err => {
			document.body.textContent = `Failed to load entry "${entry}": ${err.message}`;
		});
	}
}
