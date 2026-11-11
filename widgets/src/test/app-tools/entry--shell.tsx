import * as React from 'react';
import {Outlet} from 'react-router';
import {ModuleFE_Routing} from '@nu-art/thunder-routing';
import {ATS_Backend} from '../../../../ui-modules/src/main/TS_AppTools/types.js';
import {TS_AppTools} from '../../../../ui-modules/src/main/TS_AppTools/TS_AppTools.js';
import {ThunderstormAppToolsScreens} from '../../../../ui-modules/src/main/app-tools-screens.js';
import {ATS_AccountEditor} from '../../../../auth/user-account/frontend/src/main/_ats/account-editor/ATS_AccountEditor.js';
import {ATS_SessionData} from '../../../../auth/user-account/frontend/src/main/_ats_session-data/ATS_SessionData.js';
import {ModuleFE_ActionProcessor} from '../../../../action-processor/frontend/src/main/ModuleFE_ActionProcessor.js';
import {ATS_ActionProcessor} from '../../../../action-processor/frontend/src/main/ATS_ActionProcessor/index.js';
import '../../../../../styles/theme-light/src/main/theme.scss';
import '../../../../../styles/theme-dark/src/main/theme.scss';

document.documentElement.dataset.theme = 'dark';
document.documentElement.style.height = '100%';
document.body.style.height = '100%';
document.body.style.margin = '0';
const mount = document.getElementById('root');
if (mount)
	mount.style.height = '100%';

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

function RefactoringActions() {
	return <ATS_ActionProcessor canRun={true}/>;
}

const Screen_DevActions = {
	name: 'Refactoring Actions',
	key: 'refactoring-actions',
	group: ATS_Backend,
	renderer: RefactoringActions,
};

const screens = [
	...ThunderstormAppToolsScreens,
	ATS_AccountEditor.screen,
	ATS_SessionData.screen,
	Screen_DevActions,
];

function TestRoot() {
	return <Outlet/>;
}

const route = {
	key: 'test-root',
	path: '',
	Component: TestRoot,
	children: [{
		key: 'test-prefix',
		path: 'src/test',
		Component: TestRoot,
		children: [TS_AppTools.createRoute(screens, 'index.html')],
	}],
};

export default function EntryAppToolsShell() {
	const [shell] = React.useState(() => ModuleFE_Routing.generateRoutes(route));
	return <div style={{height: '100%', display: 'flex'}}>{shell}</div>;
}
