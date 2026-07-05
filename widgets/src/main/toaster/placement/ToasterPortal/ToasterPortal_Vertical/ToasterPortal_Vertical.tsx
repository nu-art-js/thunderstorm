import {createRef} from 'react';
import {OnWindowResized} from '@nu-art/thunder-core';
import {InferProps, InferState} from '../../../../_core/component-types.js';
import './ToasterPortal_Vertical.scss';
import {TypedMap} from '@nu-art/ts-common';
import {ToasterPortal} from '../_base/ToasterPortal.js';
import {ToastItemStatus} from '../../types.js';
import {ToasterItem} from '../../ToasterItem/ToasterItem.js';

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
	extends ToasterPortal<Props, State>
	implements OnWindowResized {

	private readonly ref = createRef<HTMLDivElement>();

	// ######################### Life Cycle #########################

	__onWindowResized = () => this.refreshParentHeight();

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

		//Calculate available height for new items
		let availableHeight = this.state.parentHeight - (this.state.verticalPadding * 2);
		currentlyVisibleItems.forEach(item => {
			availableHeight -= this.state.childrenHeightMap[item.model.id] + this.state.verticalGap;
		});

		//Update new items that can be visible in this render cycle
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
					style={{top: `${currentOffset}px`}}
				/>;
			})}
		</div>;
	}
}