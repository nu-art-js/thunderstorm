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

		//Start the modal centered on the trigger
		const modalPosition: Coordinates = {x: model.originPos.x - halfWidth, y: model.originPos.y - halfHeight};
		modalPosition.x += halfWidth * model.modalPos.x + (model.offset?.x || 0);
		modalPosition.y += halfHeight * model.modalPos.y + (model.offset?.y || 0);
		this.ref.current!.style.top = `${modalPosition.y}px`;
		this.ref.current!.style.left = `${modalPosition.x}px`;
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

		if (offset.y)
			current.style.top = `${rect.top + offset.y}px`;

		if (offset.x)
			current.style.left += `${rect.left + offset.x}px`;
	};
}