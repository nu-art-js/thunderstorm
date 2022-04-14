import * as React from 'react';
import {Menu_Model, MenuListener} from '../../modules/menu/MenuModule';
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

	__onMenuDisplay = (element: Menu_Model) => {
		this.setState({menuModel: element, open: !!element});
	};

	__onMenuHide = (id: string) => {
		const element = this.state.menuModel;
		if (!element || element.id !== id)
			return;

		this.setState({menuModel: undefined});
	};

	protected deriveStateFromProps(nextProps: Prop): State {
		return {open: false};
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
			<TS_Overlay showOverlay={this.state.open} onClickOverlay={() => this.setState({open: false})}>
				<div className="ts-popup-menu__menu" style={menuModel.pos}>
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
