import * as React from 'react';
import {MenuPosition, ModuleFE_PopUp, PopUp_Model_Content, PopUpListener} from '../../component-modules/ModuleFE_PopUp';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_PopUpOverlay.scss';
import {TS_Overlay} from '../TS_Overlay';
import {OnWindowResized} from '../../modules/ModuleFE_Window';
import {stopPropagation} from '../../utils/tools';
import {resolveContent} from '@nu-art/ts-common';


type State = {
	model?: PopUp_Model_Content,
	open: boolean
}
type Prop = {}

export class TS_PopUpOverlay
	extends ComponentSync<Prop, State>
	implements PopUpListener, OnWindowResized {

	__onWindowResized(): void {
		this.ref = undefined;
		if (this.state.model)
			ModuleFE_PopUp.hide(this.state.model.id);
	}

	private ref?: HTMLDivElement;
	private minimumMargin: number = 5;
	private currentPos?: MenuPosition;

	__onPopUpDisplay = (model: PopUp_Model_Content) => {
		this.currentPos = model.pos;
		this.setState({model, open: !!model});
	};

	__onPopUpHide = (id: string) => {
		const element = this.state.model;
		if (!element || element.id !== id)
			return;

		this.ref = undefined;
		this.currentPos = undefined;
		this.setState({model: undefined});
	};

	protected deriveStateFromProps(nextProps: Prop): State {
		return {open: false};
	}

	correctPositionIfOutOfBounds = () => {
		if (this.isInBounds())
			return;

		this.setBounds();
	};

	isInBounds() {
		if (!this.ref)
			return;

		const boundingClientRect = this.ref.getBoundingClientRect();

		return this.isThisInBounds(
			boundingClientRect.left,
			boundingClientRect.top,
			boundingClientRect.right,
			boundingClientRect.bottom);
	}

	private isThisInBounds(left: number, top: number, right: number, bottom: number): boolean {
		return !(top < this.minimumMargin ||
			left < this.minimumMargin ||
			right > (window.innerWidth - this.minimumMargin) ||
			bottom > (window.innerHeight - this.minimumMargin));
	}

	private setBounds() {
		if (!this.ref || !this.state.model || !this.state.model.pos)
			return;
		const boundingClientRect = this.ref.getBoundingClientRect();
		let left: number = boundingClientRect.left;
		let top: number = boundingClientRect.top;

		if (boundingClientRect.right > (window.innerWidth - this.minimumMargin))
			left = window.innerWidth - boundingClientRect.width - this.minimumMargin;

		if (boundingClientRect.bottom > (window.innerHeight - this.minimumMargin))
			top = window.innerHeight - boundingClientRect.height - this.minimumMargin;

		this.currentPos = {left: left, top: top};

		this.forceUpdate();
	}

	render() {
		const {model, open} = this.state;

		if (!model || !open)
			return '';

		return <div className="ts-popup">
			<TS_Overlay showOverlay={open} onClickOverlay={(e) => {
				stopPropagation(e);
				this.setState({open: false});
				this.ref = undefined;
			}}>
				<div className="ts-popup__content" style={this.currentPos}
						 id={model.id}
						 ref={_ref => {
							 if (this.ref || !_ref)
								 return;

							 this.ref = _ref;
							 setTimeout(this.correctPositionIfOutOfBounds);
						 }}>
					{resolveContent(model.content)}
				</div>
			</TS_Overlay>
		</div>;
	}
}
