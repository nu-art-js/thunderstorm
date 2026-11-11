import * as React from 'react';
import {createRoot} from 'react-dom/client';
import '../../../../../widgets/src/main/theme.scss';
import '../../../../../../styles/theme-light/src/main/theme.scss';
import '../../../../../../styles/theme-dark/src/main/theme.scss';
import {ModuleFE_ActionProcessor} from '../../main/ModuleFE_ActionProcessor.js';
import {ATS_ActionProcessor} from '../../main/ATS_ActionProcessor/index.js';

document.documentElement.dataset.theme = 'light';

const actions = [
	{
		key: 'setup-project',
		label: 'Setup project',
		group: 'Initialization',
		description: 'Run the project setup graph from the configured roots.',
		destructive: true,
	},
	{
		key: 'knowledge-access-restamp',
		label: 'Knowledge access restamp',
		group: 'Knowledge',
		description: 'Restamp every existing knowledge node with the current structural mint bag, or inherit from parent.',
		destructive: true,
	},
];

ModuleFE_ActionProcessor.vv1.list = () => ({
	executeSync: async () => actions,
});

ModuleFE_ActionProcessor.vv1.execute = () => ({
	executeSync: async () => undefined,
});

const root = createRoot(document.getElementById('test-root')!);
root.render(<ATS_ActionProcessor canRun={true}/>);

window.TestReady = true;
