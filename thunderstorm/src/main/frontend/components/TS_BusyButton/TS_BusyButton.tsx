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
import {_className} from '../../utils/tools';
import {LinearLayoutProps, LL_H_C} from '../Layouts';
import './TS_BusyButton.scss';
import {TS_ButtonLoader} from '../TS_ButtonLoader';
import {ReactNode} from 'react';

type Props_Button = LinearLayoutProps & {
	disabled?: boolean;
	onDisabledClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
	isBusy?: boolean;
	loadingRenderer?: ReactNode | (() => ReactNode);
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
export const TS_BusyButton = (props: Props_Button) => {
	const renderItems = () => {
		if (props.isBusy) {
			if (props.loadingRenderer)
				return typeof props.loadingRenderer === 'function' ? props.loadingRenderer() : props.loadingRenderer;

			return <TS_ButtonLoader/>;
		}

		return props.children;
	};

	const onClick = (e: React.MouseEvent<HTMLDivElement>) => {
		if (props.isBusy)
			return;

		if (props.disabled)
			return props.onDisabledClick?.(e);

		return props.onClick?.(e);
	};

	const className = _className('ts-busy-button', props.className, props.disabled && 'ts-busy-button__disabled', props.isBusy && 'ts-busy-button__loading');

	return <LL_H_C
		{...props}
		className={className}
		onClick={onClick}
	>{renderItems()}</LL_H_C>;
};