import * as React from 'react';
import {TS_ToastOverlay} from '../../main/toaster/global/TS_ToastOverlay.js';
import {ModuleFE_Toaster} from '../../main/toaster/global/ModuleFE_Toaster.js';

export default function EntryToasterV1() {
	return (
		<div data-testid="toaster-demo-container">
			<button data-testid="toast-info-trigger" onClick={() => ModuleFE_Toaster.toastInfo('Info message')}>Info</button>
			<button data-testid="toast-success-trigger" onClick={() => ModuleFE_Toaster.toastSuccess('Success message')}>Success</button>
			<TS_ToastOverlay/>
		</div>
	);
}
