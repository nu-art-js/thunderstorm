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
import {ThunderstormModule, UrlTarget} from '../../modules/ThunderstormModule';
import './TS_Link.scss';
import {QueryParams} from '../../../shared/types';
import {_className} from '../../utils/tools';

type Props = {
	url: string | { url: string, params?: QueryParams }
	target?: UrlTarget;
	className?: string;
}

export class TS_Link
	extends React.Component<Props, any> {

	private handleOnClick = () => {
		ThunderstormModule.openUrl(this.props.url, this.props.target);
	};

	render() {
		const className = _className('ts-link', this.props.className);
		return <div className={className} onClick={this.handleOnClick}>
			{this.props.children}
		</div>;
	}
}