import {InferProps, InferState} from '@nu-art/thunderstorm-frontend';
import {ToasterPortal} from '../_base/ToasterPortal.js';
import {ToastItemStatus} from '../../types.js';
import {exists} from '@nu-art/ts-common';
import {ToasterItem} from '../../ToasterItem/ToasterItem.js';
import './ToasterPortal_BottomUp.scss';
import {createRef, CSSProperties} from 'react';

type Props = {
	height: number;
	bottomOffset?: number;
};

type State = {
	height: number;
	bottomOffset: number;
};

export class ToasterPortal_BottomUp
	extends ToasterPortal<Props, State> {

	private toasterItemLineClamp: number = 1;
	private readonly ref = createRef<HTMLDivElement>();

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: InferProps<this>, state: InferState<this>) {
		state = super.deriveStateFromProps(nextProps, state);
		state.height = nextProps.height;
		state.bottomOffset = nextProps.bottomOffset ?? 0;
		return state;
	}

	componentDidUpdate() { //After each render
		this.processItems();
	}

	// ######################### Logic #########################

	private getCurrentlyVisibleElement() {
		if (!this.ref.current?.children)
			return;

		const children = Array.from(this.ref.current.children);
		return children[0] as HTMLDivElement;
	}

	private processItems() {
		//No items to process, or first item is currently on screen or transitioning out
		const nextVisibleItem = this.state.items[0];
		if (!nextVisibleItem || nextVisibleItem.status !== ToastItemStatus.Loaded)
			return;

		//Set line capping based on portal height
		if (nextVisibleItem.model.body) {
			const element = this.getCurrentlyVisibleElement();
			//Ramp up element linecap on the body until it overflows
			if (element) {
				const maxHeight = this.state.height - this.state.bottomOffset;
				let previousCalculatedHeight: number | undefined;
				let lineClamp: number = 0;
				while (!previousCalculatedHeight || previousCalculatedHeight < maxHeight) {
					lineClamp++;
					element.style.setProperty('--line-clamp', `${lineClamp}`);
					const currentCalculatedHeight = element.getBoundingClientRect().height;
					//If upping the line clamp did not change the height then we can stop checking here
					if (previousCalculatedHeight && currentCalculatedHeight === previousCalculatedHeight)
						break;
					previousCalculatedHeight = currentCalculatedHeight;
				}
				this.toasterItemLineClamp = lineClamp - 1;
				element.style.setProperty('--line-clamp', `${lineClamp - 1}`);
			}
		}
		this.state.items[0].status = ToastItemStatus.Visible;
		this.reportConsumeModel(this.state.items[0].model.id);
		this.forceUpdate();
	}

	// ######################### Render #########################

	render() {
		const item = this.state.items[0];
		return <div
			ref={this.ref}
			className={'toasting-portal__bottom-up'}
			style={{height: `${this.state.height}px`}}
		>
			{exists(item) && <ToasterItem
				key={item.model.id}
				model={item.model}
				status={item.status}
				style={{
					bottom: `${this.state.bottomOffset}px`,
					['--line-clamp']: `${this.toasterItemLineClamp}`
				} as CSSProperties}
			/>}
		</div>;
	}
}