import {ComponentSync, DefaultProps, InferProps, InferState} from '@nu-art/thunderstorm-frontend';
import {ModuleFE_Toasting, OnToastingModelsChange} from '../../_core/ModuleFE_Toasting.js';
import {ToastItem, ToastItemStatus} from '../types.js';
import {Model_Toast} from '../../_core/types.js';

type Props = {
	modelFilter: (model: Model_Toast) => boolean;
};

type State = {
	items: ToastItem[];
};

export abstract class ToasterPortal<_P extends {} = {}, _S extends {} = {}>
	extends ComponentSync<Props & _P, State & _S>
	implements OnToastingModelsChange {

	static defaultProps: DefaultProps<ToasterPortal> = {
		modelFilter: () => true,
	};

	// ######################### Abstract Logic #########################

	protected abstract handleModelChanges: (toAdd: ToastItem[], toRemove: ToastItem[]) => void;

	// ######################### Life Cycle #########################

	__onToastingModelsChange = () => {
		const allModels = ModuleFE_Toasting.getModels();
		const existingModelIds = new Set<string>(this.state.items.map(i => i.model.id));
		const allModelIds = new Set<string>(allModels.map(m => m.id));
		const itemsToAdd = allModels.filter(model => !existingModelIds.has(model.id) && this.props.modelFilter(model)).map(model => ({model, status: ToastItemStatus.Loaded}) as ToastItem);
		const itemsToRemove = this.state.items.filter(item => !allModelIds.has(item.model.id));
		if(!itemsToAdd.length && !itemsToRemove.length)
			return;

		this.handleModelChanges(itemsToAdd, itemsToRemove);
	};

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state.items ??= [];
		return state;
	}

	// ######################### Logic #########################

	protected reportConsumeModel = (id: string) => ModuleFE_Toasting.toast.process(id);
}