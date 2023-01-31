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
import {ReactNode} from 'react';
import {_className} from '../../utils/tools';
import {LinearLayoutProps, LL_H_C} from '../Layouts';
import './TS_BusyButton.scss';
import {TS_ButtonLoader} from '../TS_ButtonLoader';
import {ComponentSync} from '../../core/ComponentSync';


type Props_Button = LinearLayoutProps & {
	disabled?: boolean;
	onClick: (e: React.MouseEvent<HTMLDivElement>) => Promise<any>
	onDisabledClick?: (e: React.MouseEvent<HTMLDivElement>) => Promise<any>;
	loadingRenderer?: ReactNode | (() => ReactNode);
	keepLoaderOnSuccess?: boolean;
}

type State_Button = {
	isBusy: boolean
	disabled: boolean;
}

/**
 * A button made simpler
 *
 *
 * <b>SCSS:</b>
 * ```scss
 * .ts-button {
 *   .ts-button__disabled {
 *   }
 * }
 * ```
 */
export class TS_BusyButton
	extends ComponentSync<Props_Button, State_Button> {

	static defaultProps: Partial<Props_Button> = {
		keepLoaderOnSuccess: false,
		loadingRenderer: <TS_ButtonLoader/>,
	};

	protected deriveStateFromProps(nextProps: Props_Button): State_Button | undefined {
		return {
			disabled: !!nextProps.disabled,
			isBusy: !!this.state?.isBusy
		};
	}

	private renderItems = () => {
		if (this.state.isBusy) {
			const loadingRenderer = this.props.loadingRenderer;
			return typeof loadingRenderer === 'function' ? loadingRenderer() : loadingRenderer;
		}
		return this.props.children;
	};

	private onClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (this.state.isBusy)
			return;

		if (this.state.disabled && !this.props.onDisabledClick)
			return;

		this.setState({isBusy: true}, async () => {
			try {
				await this.props[this.state.disabled ? 'onDisabledClick' : 'onClick']?.(e);
				if (!this.props.keepLoaderOnSuccess && this.mounted)
					this.setState({isBusy: false});
			} catch (err) {
				if (this.mounted)
					this.setState({isBusy: false});
			}
		});
	};

	render() {
		const {onClick, disabled, loadingRenderer, onDisabledClick, ...restOfProps} = this.props;

		const className = _className('ts-busy-button', this.props.className, !this.state.isBusy && this.state.disabled && 'ts-busy-button__disabled', this.state.isBusy && 'ts-busy-button__loading');

		return <LL_H_C
			{...restOfProps}
			className={className}
			onClick={this.onClick}>
			{this.renderItems()}
		</LL_H_C>;
	}
}