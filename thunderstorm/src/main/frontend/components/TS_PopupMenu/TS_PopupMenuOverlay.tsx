import * as React from 'react';
import {Menu_Model, MenuListener, MenuModule} from '../../component-modules/MenuModule';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_PopupMenuOverlay.scss';
import {TS_Overlay} from '../TS_Overlay';
import {TS_Tree} from '../TS_Tree';
import {generateHex} from '@nu-art/ts-common';
import {OnWindowResized} from '../../modules/ModuleFE_Window';
import {stopPropagation} from '../../utils/tools';


export type MenuPosition =
	{ left: number, top: number }
	| { left: number, bottom: number }
	| { right: number, top: number }
	| { right: number, bottom: number };

type State = {
	menuModel?: Menu_Model,
	open: boolean
}
type Prop = {}

export class TS_PopupMenuOverlay
	extends ComponentSync<Prop, State>
	implements MenuListener, OnWindowResized {

	__onWindowResized(): void {
		this.ref = undefined;
		if (this.state.menuModel)
			MenuModule.hide(this.state.menuModel.id);
	}

	private ref?: HTMLDivElement;
	private minimumMargin: number = 5;
	private currentPos?: MenuPosition;

	__onMenuDisplay = (element: Menu_Model) => {
		this.currentPos = element.pos;
		this.setState({menuModel: element, open: !!element});
	};

	__onMenuHide = (id: string) => {
		const element = this.state.menuModel;
		if (!element || element.id !== id)
			return;

		this.ref = undefined;
		this.currentPos = undefined;
		this.setState({menuModel: undefined});
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
		if (!this.ref || !this.state.menuModel || !this.state.menuModel.pos)
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
		const menuModel = this.state.menuModel;
		if (!menuModel) {
			return null;
		}

		if (!this.state.open)
			return '';

		return <div className="ts-popup-menu">
			<TS_Overlay showOverlay={this.state.open} onClickOverlay={(e) => {
				stopPropagation(e);
				this.setState({open: false});
				this.ref = undefined;
			}}>
				<div className="ts-popup-menu__menu" style={this.currentPos}
						 ref={_ref => {
							 if (this.ref || !_ref)
								 return;

							 this.ref = _ref;
							 setTimeout(this.correctPositionIfOutOfBounds);
						 }}>
					<TS_Tree
						id={generateHex(8)}
						adapter={menuModel.adapter}
						onNodeClicked={menuModel.onNodeClicked}
					/>
				</div>
			</TS_Overlay>
		</div>;
	}
}
