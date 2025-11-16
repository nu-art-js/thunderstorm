import {Module, removeFromArrayByIndex} from '@nu-art/ts-common';
import {Model_FloatingWindow} from '../types.js';
import {dispatcher_FloatingWindows_FocusWindow} from '../_dispatchers/focus-window.js';
import {dispatch_FloatingWindows_WindowsUpdated} from '../_dispatchers/models-updated.js';

class ModuleFE_FloatingWindow_Class
	extends Module {

	public readonly windowModels: Model_FloatingWindow[] = [];

	public window = {
		add: (model: Model_FloatingWindow): void => {
			if (this.windowModels.find(item => item.key === model.key))
				return void dispatcher_FloatingWindows_FocusWindow.dispatchUI(model.key);

			this.windowModels.push({...model});
			dispatch_FloatingWindows_WindowsUpdated.dispatchUI();
		},
		remove: (key: string): void => {
			const index = this.windowModels.findIndex(model => model.key === key);
			if (index === -1)
				return;

			removeFromArrayByIndex(this.windowModels, index);
			dispatch_FloatingWindows_WindowsUpdated.dispatchUI();
		}
	};
}

export const ModuleFE_FloatingWindows = new ModuleFE_FloatingWindow_Class();