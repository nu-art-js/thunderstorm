import {createRef} from 'react';
import {ToasterPortal} from './ToasterPortal.js';
import {ToastItem, ToastItemStatus} from '../types.js';
import {InferProps, InferState} from '@nu-art/thunderstorm-frontend';
import {ToasterItem} from '../ToasterItem/ToasterItem.js';
import './ToasterPortal_Vertical.scss';
import {TypedMap} from '@nu-art/ts-common';

type Props = {
	verticalPadding?: number;
	verticalGap?: number;
};

type State = {
	parentHeight: number;
	childrenHeightMap: TypedMap<number>;
	verticalPadding: number;
	verticalGap: number;
};

export class ToasterPortal_Vertical
	extends ToasterPortal<Props, State> {

	private readonly ref = createRef<HTMLDivElement>();

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state = super.deriveStateFromProps(nextProps, state);
		state.parentHeight ??= 0;
		state.childrenHeightMap ??= {};
		state.verticalGap = nextProps.verticalGap ?? 0;
		state.verticalPadding = nextProps.verticalPadding ?? 0;
		return state;
	}

	componentDidMount() { //Once on load
		this.refreshParentHeight();
	}

	componentDidUpdate() { //After each render
		this.mapChildrenHeight();
		this.processItems();
	}

	// ######################### Logic #########################

	protected handleModelChanges = (toAdd: ToastItem[], toRemove: ToastItem[]) => {
		const newItems = toAdd.length ? [...this.state.items, ...toAdd] : [...this.state.items];
		if (toRemove.length) {
			const toRemoveIds = new Set<string>(toRemove.map(i => i.model.id));
			newItems.forEach(item => {
				if (toRemoveIds.has(item.model.id))
					item.status = ToastItemStatus.Closed;
			});
			setTimeout(() => {
				const items = this.state.items.filter(i => !toRemoveIds.has(i.model.id));
				this.setState({items});
			}, 200);
		}
		this.setState({items: newItems});
	};

	private refreshParentHeight() {
		if (!this.ref.current)
			return;

		const parent = this.ref.current.parentElement!;
		this.setState({parentHeight: parent.offsetHeight ?? 0});
	}

	private mapChildrenHeight() {
		const children = this.ref.current?.children;
		if (!children?.length)
			return;

		Array.from(children).forEach(child => {
			const id = child.getAttribute('data-id');
			if (!id)
				return;

			this.state.childrenHeightMap[id] = child.getBoundingClientRect().height;
		});
	}

	private processItems() {
		let shouldUpdate = false;
		const currentlyVisibleItems = this.state.items.filter(item => item.status !== ToastItemStatus.Loaded);
		const unProcessedItems = this.state.items.filter(item => item.status === ToastItemStatus.Loaded);
		if (!unProcessedItems.length)
			return;

		let availableHeight = this.state.parentHeight - (this.state.verticalPadding * 2);
		currentlyVisibleItems.forEach(item => {
			availableHeight -= this.state.childrenHeightMap[item.model.id] + this.state.verticalGap;
		});


		for (const item of unProcessedItems) {
			const itemHeight = this.state.childrenHeightMap[item.model.id];
			if (!itemHeight || itemHeight > availableHeight)
				break;

			item.status = ToastItemStatus.Visible;
			shouldUpdate = true;
			availableHeight -= itemHeight + (this.state.verticalGap);
			this.reportConsumeModel(item.model.id);
		}

		if (shouldUpdate)
			this.forceUpdate();
	}

	// ######################### Render #########################

	render() {
		let topOffset = this.state.verticalPadding ?? 0;
		return <div className={'toasting-portal__vertical'} ref={this.ref}>
			{this.state.items.map(item => {
				const currentOffset = topOffset;
				topOffset += this.state.childrenHeightMap[item.model.id] + (this.state.verticalGap ?? 0);
				return <ToasterItem
					key={item.model.id}
					model={item.model}
					status={item.status}
					style={{
						top: `${currentOffset}px`,
					}}
				/>;
			})}
		</div>;
	}
}