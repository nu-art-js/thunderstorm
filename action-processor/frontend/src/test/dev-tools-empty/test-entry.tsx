import * as React from 'react';
import {createRoot} from 'react-dom/client';
import '../../../../../widgets/src/main/theme.scss';
import '../../../../../../styles/theme-light/src/main/theme.scss';
import '../../../../../../styles/theme-dark/src/main/theme.scss';
import {ModuleFE_ActionProcessor} from '../../main/ModuleFE_ActionProcessor.js';
import {ATS_ActionProcessor} from '../../main/ATS_ActionProcessor/index.js';

document.documentElement.dataset.theme = 'light';

ModuleFE_ActionProcessor.vv1.list = () => ({
	executeSync: async () => [],
});

const root = createRoot(document.getElementById('test-root')!);
root.render(<ATS_ActionProcessor canRun={true}/>);

window.TestReady = true;
