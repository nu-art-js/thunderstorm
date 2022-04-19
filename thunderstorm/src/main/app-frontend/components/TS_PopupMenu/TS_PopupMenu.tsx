import * as React from 'react';
import {Menu_Model, MenuListener} from '../../component-modules/MenuModule';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_PopupMenu.scss';
import {TS_Overlay} from '../TS_Overlay';
import {TS_Tree} from '../TS_Tree';
import {generateHex} from '@nu-art/ts-common';

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

export class TS_PopupMenu
	extends ComponentSync<Prop, State>
	implements MenuListener {

	private ref?: HTMLDivElement;
	private minimumMargin: number = 5;

	__onMenuDisplay = (element: Menu_Model) => {
		this.setState({menuModel: element, open: !!element});
	};

	__onMenuHide = (id: string) => {
		const element = this.state.menuModel;
		if (!element || element.id !== id)
			return;

		this.ref = undefined;
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

		return !(boundingClientRect.top < this.minimumMargin ||
			boundingClientRect.left < this.minimumMargin ||
			boundingClientRect.right > (window.innerWidth - this.minimumMargin) ||
			boundingClientRect.bottom > (window.innerHeight - this.minimumMargin));
	}

	private setBounds() {
		if (!this.ref || !this.state.menuModel || !this.state.menuModel.pos)
			return;
		const boundingClientRect = this.ref.getBoundingClientRect();

		let left: number = boundingClientRect.left;
		let top: number = boundingClientRect.top;

		if (boundingClientRect.right > (window.innerWidth - this.minimumMargin))
			left = window.innerWidth - boundingClientRect.width - this.minimumMargin;


		// not working?!
		if (boundingClientRect.bottom > (window.innerHeight - this.minimumMargin)) {
			top = window.innerHeight - boundingClientRect.height - this.minimumMargin;
		}

		console.log('CHECK', boundingClientRect);


		console.log(top, left);
		if (this.state.menuModel)
			this.state.menuModel.pos = {left: left, top: top};
		else return;
		this.forceUpdate();
	}

	render() {
		const menuModel = this.state.menuModel;
		if (!menuModel) {
			console.log('Missing PopupMenu datamodel!');
			return null;
		}

		if (!this.state.open)
			return '';


//tree instead of menu component
		return <div className="ts-popup-menu">
			<TS_Overlay showOverlay={this.state.open} onClickOverlay={() => {
				this.setState({open: false});
				this.ref = undefined;
			}}>
				<div className="ts-popup-menu__menu" style={menuModel.pos}
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
