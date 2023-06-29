import * as React from 'react';
import {logicalXOR} from '@nu-art/ts-common';
import {Coordinates, Model_ToolTip} from '../../../component-modules/mouse-interactivity/types';
import {ComponentSync} from '../../../core/ComponentSync';

type State = {
	model?: Model_ToolTip,
	open: boolean
}
type Prop = {}

export class TS_MouseInteractivity
	extends ComponentSync<Prop, State> {

	protected ref: React.RefObject<HTMLDivElement> = React.createRef();

	private minimumMargin: number = 5;

	protected deriveStateFromProps(nextProps: Prop, state?: State): State {
		state ??= this.state ? {...this.state} : {} as State;
		state.open ??= false;
		return state;
	}

	componentDidUpdate() {
		if (!this.state.model || !this.state.open)
			return;

		this.setModalPosition();
		this.keepModalInView();
	}

	private setModalPosition = () => {
		const model = this.state.model!;
		const modalRect = this.ref.current!.getBoundingClientRect();
		const halfWidth = (modalRect.width / 2);
		const halfHeight = (modalRect.height / 2);
		const xAxisAnchor = model.xAxisAnchor ?? 'left';
		const yAxisAnchor = model.yAxisAnchor ?? 'top';

		//Start the modal centered on the trigger
		const modalPosition: Coordinates = {
			x: (xAxisAnchor === 'right' ? window.innerWidth - model.originPos.x : model.originPos.x) - halfWidth,
			y: (yAxisAnchor === 'bottom' ? window.innerHeight - model.originPos.y : model.originPos.y) - halfHeight,
		};

		//Move the modal based on modalPos property
		modalPosition.x += model.modalPos.x * (xAxisAnchor === 'right' ? -halfWidth : halfWidth);
		modalPosition.y += model.modalPos.y * (yAxisAnchor === 'bottom' ? -halfHeight : halfHeight);

		//Add offsets to modal
		modalPosition.x += model.offset?.x || 0;
		modalPosition.y += model.offset?.y || 0;

		//Set position
		this.ref.current!.style[yAxisAnchor] = `${modalPosition.y}px`;
		this.ref.current!.style[xAxisAnchor] = `${modalPosition.x}px`;
	};

	private getDistancesFromViewPort = () => {
		const rect = this.ref.current!.getBoundingClientRect();
		return {
			top: rect.top,
			left: rect.left,
			right: window.innerWidth - rect.right,
			bottom: window.innerHeight - rect.bottom
		};
	};

	private keepModalInView = () => {
		const distances = this.getDistancesFromViewPort();
		const current = this.ref.current!;
		const rect = current.getBoundingClientRect();
		const offset = {x: 0, y: 0};
		const xAxisAnchor = this.state.model!.xAxisAnchor ?? 'left';
		const yAxisAnchor = this.state.model!.xAxisAnchor ?? 'top';

		//Fix vertical axis if only one side is overflowing
		if (logicalXOR(distances.bottom < this.minimumMargin, distances.top < this.minimumMargin)) {
			//If bottom is overflowing
			if (distances.bottom < this.minimumMargin) {
				const correction = distances.bottom - this.minimumMargin;
				//If correction doesn't cause top to overflow
				if (distances.top + correction >= this.minimumMargin)
					offset.y = correction;
			} else { //Top is overflowing
				const correction = -distances.top + this.minimumMargin;
				//If correction doesn't cause bottom to overflow
				if (distances.bottom - correction >= this.minimumMargin)
					offset.y = correction;
			}
		}

		//Fix horizontal axis if only one side is overflowing
		if (logicalXOR(distances.right < this.minimumMargin, distances.left < this.minimumMargin)) {
			//If right is overflowing
			if (distances.right < this.minimumMargin) {
				const correction = distances.right - this.minimumMargin;
				//If correction doesn't cause left to overflow
				if (distances.left + correction >= this.minimumMargin)
					offset.x = correction;
			} else { //Left is overflowing
				const correction = -distances.left + this.minimumMargin;
				//If correction doesn't cause right to overflow
				if (distances.right - correction >= this.minimumMargin)
					offset.x = correction;
			}
		}

		if (offset.y) {
			if (yAxisAnchor === 'top')
				current.style.top = `${rect.top + offset.y}px`;
			else
				current.style.bottom = `${rect.bottom - offset.y}px`;
		}

		if (offset.x) {
			if (xAxisAnchor === 'left')
				current.style.left = `${rect.left + offset.x}px`;
			else
				current.style.right = `${rect.right - offset.x}px`;
		}
	};
}