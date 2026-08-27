import {ComponentSync} from '../../../../_core/ComponentSync.js';
import {DefaultProps, InferProps, InferState} from '../../../../_core/component-types.js';
import {Model_Toast} from '@nu-art/toasting';
import {ToastItem, ToastItemStatus} from '../../types.js';
import {ModuleFE_Toasting, OnToastingModelsChange} from '@nu-art/toasting';

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

	// ######################### Life Cycle #########################

	__onToastingModelsChange = () => {
		const {toAdd, toRemove} = this.inferItems();
		if (!toAdd.length && !toRemove.length)
			return;

		//Send data to portal implementation
		this.handleModelChanges(toAdd, toRemove);
	};

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state.items ??= [];
		return state;
	}

	// ######################### Internal Logic #########################

	private inferItems = (): { toAdd: ToastItem[]; toRemove: ToastItem[] } => {
		const allModels = ModuleFE_Toasting.getModels();
		const existingModelIds = new Set<string>(this.state.items.map(i => i.model.id));
		const allModelIds = new Set<string>(allModels.map(m => m.id));
		//Calculate which models to add, and which models to remove
		const itemsToAdd = allModels.filter(model => !existingModelIds.has(model.id) && this.props.modelFilter(model)).map(model => ({
			model,
			status: ToastItemStatus.Loaded
		}) as ToastItem);
		const itemsToRemove = this.state.items.filter(item => !allModelIds.has(item.model.id));
		return {toAdd: itemsToAdd, toRemove: itemsToRemove,};
	};

	protected handleModelChanges(toAdd: ToastItem[], toRemove: ToastItem[]): void {
		//Start out new items as a combination of the current items and the ones to add.
		const newItems = toAdd.length ? [...this.state.items, ...toAdd] : [...this.state.items];
		if (toRemove.length) { //Update each item to remove
			const toRemoveIds = new Set<string>(toRemove.map(i => i.model.id));
			newItems.forEach(item => {
				if (toRemoveIds.has(item.model.id))
					item.status = ToastItemStatus.Closed;
			});
			//Trigger timer for item removal from the array
			setTimeout(() => {
				const items = this.state.items.filter(i => !toRemoveIds.has(i.model.id));
				this.setState({items} as InferState<this>);
			}, 200);
		}
		this.setState({items: newItems} as InferState<this>);
	}

	protected reportConsumeModel = (id: string) => ModuleFE_Toasting.toast.process(id);
}