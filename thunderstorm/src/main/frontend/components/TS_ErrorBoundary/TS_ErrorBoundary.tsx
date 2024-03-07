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
import {Logger} from '@nu-art/ts-common';
import {BaseComponent} from '../../core/ComponentBase';


type State = {
	error?: Error,
	errorInfo?: React.ErrorInfo
}

type Props = React.PropsWithChildren<{
	logger?: Logger
	component?: BaseComponent,
	onClick?: (e: any) => void,
	renderer?: (e: any) => ReactNode
	error?: Error;
}>;

export class TS_ErrorBoundary
	extends React.Component<Props, State> {

	//######################### Life Cycle #########################

	constructor(props: Props) {
		super(props);
		this.state = {};
	}

	/**
	 * Called on changes in props.
	 * @param props
	 * @param state
	 */
	static getDerivedStateFromProps(props: Props, state: State) {
		state.error = props.error ?? state.error;
		return state;
	}

	/**
	 * Called when a descendant component throws an error (and there isn't an error boundary in the way already)
	 * used to return a state based on the error
	 * @param error
	 */
	static getDerivedStateFromError(error: Error) {
		return {error};
	}

	/**
	 * Called when a descendant component throws an error (and there isn't an error boundary in the way already)
	 * Can be used to return a state based on the error, but will be deprecated at some point, so watch out.
	 * @param error
	 * @param errorInfo
	 */
	componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
		this.setState({error, errorInfo});
	}

	/**
	 * Returns true.
	 * This component's props will not change unless an error has occurred, but the children component might need to
	 * because their props might have changed. therefore, inorder not to block their lifecycle, this component must always update.
	 * @param nextProps
	 * @param nextState
	 * @param nextContext
	 */
	shouldComponentUpdate(nextProps: Readonly<Props>, nextState: Readonly<State>, nextContext: any): boolean {
		return true;
	}

	//######################### Render #########################

	private defaultRenderer = () => {
		const titleMessage = randomMessages[Math.floor(Math.random() * randomMessages.length)];
		return <div className={'ts-error-boundary'} onClick={this.props.onClick ?? this.onErrorBoundaryClick}>
			<div className={'ts-error-boundary__pic'}>(ノಠ益ಠノ)</div>
			<div className={'ts-error-boundary__title'}>{titleMessage}</div>
		</div>;
	};

	render() {
		if (!this.state.error)
			return this.props.children;

		if (this.props.renderer)
			return this.props.renderer(this.state.error);

		return this.defaultRenderer();
	}

	protected onErrorBoundaryClick = (e: React.MouseEvent<HTMLDivElement>) => {
		const component = this.props.component;
		if (!component)
			return;

		// @ts-ignore
		const logInfo = component.logInfo;
		// @ts-ignore
		const reDeriveState = component.reDeriveState;

		if (e.metaKey)
			return logInfo('Component props and state', component.props, component.state);

		if (e.shiftKey) {
			logInfo('Re-deriving state');
			return reDeriveState();
		}

		component.forceUpdate();
	};
}

const randomMessages = [
	'Jeepers Creepers! An error!',
	'Something went wrong.. we\'re on it!',
	'This component is having a bad day',
];