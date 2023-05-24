/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import * as React from 'react';
import {CSSProperties, ReactNode} from 'react';
import {MenuBuilder, PopUp_Model_Content, PopUpListener, resolveRealPosition} from '../component-modules/ModuleFE_PopUp';
import {BadImplementationException} from '@nu-art/ts-common';
import {Adapter} from '../components/adapter/Adapter';

type Props = {
	id: string
	iconOpen: ReactNode
	iconClosed: ReactNode
	adapter: Adapter
	resolvePosition?: (button: HTMLImageElement) => { y: number, x: number }
	css?: CSSProperties
}


export class MenuAndButton
	extends React.Component<Props, { isOpen: boolean, over: boolean }>
	implements PopUpListener {

	ref = React.createRef<HTMLImageElement>();

	state = {
		isOpen: false,
		over: false
	};

	__onPopUpHide = (id: string) => {
		if (this.props.id !== id)
			return;

		this.setState({isOpen: false});
	};

	__onPopUpDisplay = (menu: PopUp_Model_Content) => {
		if (this.props.id !== menu.id)
			return;

		this.setState({isOpen: true});
	};

	render() {
		return <div
			className={'clickable'}
			onClick={this.open}
			style={{position: 'relative'}}>
			<div ref={this.ref}
					 onMouseOver={e => this.setState({over: true})}
					 onMouseOut={e => this.setState({over: false})}>
				{this.state.isOpen || this.state.over ? this.props.iconClosed : this.props.iconOpen}
			</div>
		</div>;
	}

	open = () => {
		if (!this.ref.current)
			throw new BadImplementationException('Could not find image reference');

		const pos = this.props.resolvePosition ? this.props.resolvePosition(this.ref.current) : resolveRealPosition(this.ref.current)

		new MenuBuilder(this.props.adapter, pos, {x: 0, y: 1})
			.setId(this.props.id)
			.show();
	};
}