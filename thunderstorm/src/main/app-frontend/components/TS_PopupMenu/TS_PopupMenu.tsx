import * as React from 'react';
import {CSSProperties} from 'react';
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

// const defaultStyle: CSSProperties = {
// 	width: 225,
// 	overflowX: 'hidden',
// 	overflowY: 'scroll',
// 	maxHeight: '60vh',
// 	borderRadius: 2,
// 	boxShadow: '1px 1px 4px 0 rgba(0, 0, 0, 0.3)',
// 	border: 'solid 1px transparent',
// 	backgroundColor: '#fff',
// };

type State = {
	menuModel?: Menu_Model,
	open: boolean
}
type Prop = {}


// const overlayStyle: CSSProperties = {
// 	cursor: 'default',
// 	position: 'fixed',
// 	top: 0,
// 	left: 0,
// 	bottom: 0,
// 	right: 0,
// 	height: '100vh',
// 	width: '100vw',
// 	zIndex: 3333
// };

export class TS_PopupMenu
	extends ComponentSync<Prop, State>
	implements MenuListener {

	__onMenuDisplay = (element: Menu_Model) => {
		this.setState({menuModel: element, open: !!element});
		console.log('pop! pop! pop!');
	};

	__onMenuHide = (id: string) => {
		const element = this.state.menuModel;
		if (!element || element.id !== id)
			return;

		this.setState({menuModel: undefined});
	};

	style = (pos: MenuPosition, css?: CSSProperties): CSSProperties => ({
		// ...defaultStyle,
		...css,
		...pos
	});


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
				<div className={'popup-menu'} style={this.style(menuModel.pos, menuModel.css)}>
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
