import {Module, TypedMap} from '@nu-art/ts-common';
import {Model_Toast} from './types.js';
import {ThunderDispatcher} from '@nu-art/thunderstorm-frontend';

export interface OnToastingModelsChange {
	__onToastingModelsChange: VoidFunction;
}

class ModuleFE_Toasting_Class
	extends Module {

	private models: Model_Toast[] = [];
	private modelTimeouts: TypedMap<NodeJS.Timeout> = {};

	private readonly dispatch_Models = new ThunderDispatcher<OnToastingModelsChange, '__onToastingModelsChange'>('__onToastingModelsChange');

	public toast = {
		open: (model: Model_Toast) => {
			this.models.push(model);
			this.dispatch_Models.dispatchUI();
		},
		process: (id: string) => {
			const model = this.models.find(model => model.id === id);
			if(!model)
				return;

			this.modelTimeouts[model.id] = setTimeout(() => this.toast.close(model.id), model.duration);
		},
		close: (id: string) => {
			clearTimeout(this.modelTimeouts[id]);
			delete this.modelTimeouts[id];
			this.models = this.models.filter(model => model.id !== id);
			this.dispatch_Models.dispatchUI();
		}
	};

	public getModels = () => [...this.models];
}

export const ModuleFE_Toasting = new ModuleFE_Toasting_Class();