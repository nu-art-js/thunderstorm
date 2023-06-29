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
import {LinearLayoutProps} from '../Layouts';
import './TS_Button.scss';


export type Props_Button = LinearLayoutProps & {
	disabled?: boolean;
	onDisabledClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
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
export const TS_Button = (props: Props_Button) => {
	const {onDisabledClick, ...rest} = props;
	return <div
		{...rest}
		className={_className('ts-button', props.className, props.disabled && 'ts-button__disabled')}
		onClick={props.disabled ? onDisabledClick : props.onClick}
	>{props.children}</div>;
};