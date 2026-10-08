import {Thunder} from '@nu-art/thunder-core';
import * as React from 'react';
import {createRoot} from 'react-dom/client';
// Load the package stylesheet (theme tokens + component classes) so entries render the
// way consumers see them; tokenized sizes (e.g. --ts-loader--size) are otherwise unset.
import '../../main/styles.scss';

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
