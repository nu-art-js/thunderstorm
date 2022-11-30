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
import './TS_ErrorBoundary.scss';
import {TS_Button} from '../TS_Button';
import {LL_H_C, LL_V_L} from '../Layouts';
import {Thunder} from '../../core/Thunder';

type State = {
	error?: Error,
	errorInfo?: React.ErrorInfo
}

type Props = {
	onError?: (e: any) => void,
	renderer?: (e: any) => ReactNode
};

export class TS_ErrorBoundary
	extends React.Component<Props, State> {

	//######################### Static #########################

	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	//######################### Life Cycle #########################

	static getDerivedStateFromError(error: Error) {
		return {error};
	}

	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({error, errorInfo});
	}

	//######################### Logic #########################

	private onButtonClick = () => {
		if (this.props.onError)
			return this.props.onError(this.state.error);

		this.setState({error: undefined});
	};

	//######################### Render #########################

	private renderErrorDetails = () => {
		const env = Thunder.getInstance().getConfig().label;
		if (env !== 'LOCAL' && env !== 'DEV')
			return '';

		return <details style={{whiteSpace: 'pre-wrap'}}>
			{this.state.errorInfo?.componentStack}
		</details>;
	};

	private defaultRenderer = () => {
		const titleMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
		return <div className={'ts-error-boundary'}>
			<div className={'ts-error-boundary__pic'}>(ノಠ益ಠ)ノ彡┻━┻</div>
			<div className={'ts-error-boundary__title'}>{titleMessage}</div>
			<LL_H_C className={'ts-error-boundary__container'}>
				<LL_V_L className={'ts-error-boundary__error'}>
					<div className={'ts-error-boundary__error-title'}>Error Message</div>
					<div className={'ts-error-boundary__error-message'}>{this.state.error!.toString()}</div>
				</LL_V_L>
				<TS_Button
					className={'ts-error-boundary__button'}
					onClick={this.onButtonClick}
				>Reload!</TS_Button>
			</LL_H_C>
			{this.renderErrorDetails()}
		</div>;
	};

	render() {
		if (!this.state.error)
			return this.props.children;

		if (this.props.renderer)
			return this.props.renderer(this.state.error);

		return this.defaultRenderer();
	}
}

const randomMessages = [
	'Now that\'s what i call an error!',
	'Jeepers Creepers! An error!',
	'Congratulations, it\'s an error!',
	'You\'ve got error!',
	'You haven\'t gotten an error in a while, so here!',
	'You really screwed up this time!',
	'User Error - it\'s not our fault!',
	'This component doesn\'t feel like working...',
	'This component is having a bad day',
];