import {createRef} from 'react';
import {ComponentSync} from '@nu-art/thunderstorm-frontend';
import './ToasterPortal.scss';
import {ModuleFE_Toasting, OnToastingModelsChange} from '../../_core/ModuleFE_Toasting.js';
import {ToastItem, ToastItemStatus} from '../types.js';

type Props = {};

type State = {
	items: ToastItem[];
};

export class ToasterPortal
	extends ComponentSync<Props, State>
	implements OnToastingModelsChange {

	private readonly ref = createRef<HTMLDivElement>();
	// @ts-ignore
	private parentHeight: number = 0;

	// ######################### Life Cycle #########################

	__onToastingModelsChange = () => {
		const existingModelIds = new Set<string>(this.state.items.map(i => i.model.id));
		const newModels = ModuleFE_Toasting.getModels().filter(model => !existingModelIds.has(model.id));
		if (!newModels.length)
			return;

		this.setState({
			items: [
				...this.state.items,
				...newModels.map(model => ({model, status: ToastItemStatus.Loaded}))
			]
		});
	};

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.items ??= [];
		return state;
	}

	componentDidMount() { //Once on load
		this.refreshParentHeight();
	}

	componentDidUpdate() { //After each render

	}

	// ######################### Logic #########################

	private refreshParentHeight() {
		if (!this.ref.current)
			return;

		const parent = this.ref.current.parentElement!;
		this.parentHeight = parent.offsetHeight ?? 0;
	}

	// ######################### Render #########################

	render() {
		this.logInfo(this.state.items);
		return <div className={'portal__toasting'} ref={this.ref}>

		</div>;
	}
}