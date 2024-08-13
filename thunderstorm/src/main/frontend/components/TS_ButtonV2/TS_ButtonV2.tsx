//TODO: move this thing to Thunderstorm post PR
import * as React from 'react';
import './TS_ButtonV2.scss';
import {exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {LinearLayoutProps} from '../Layouts';
import {ComponentSync} from '../../core/ComponentSync';
import {_className} from '../../utils/tools';
import {TS_ButtonLoader} from '../TS_ButtonLoader';

type Props = LinearLayoutProps & {
	disabled?: boolean;
	variant?: string;
	loaderOverride?: ResolvableContent<React.ReactNode>
	actionInProgress?: boolean
}

type State = {
	actionInProgress: boolean;
	disabled?: boolean
}

/**
 * Generic button components that behaves like a regular button, will support both
 * async and sync operations and render a loader accordingly
 * @param props All default html div element attributes and an option to disable the button override the loader and apply styling variants
 */
export class TS_ButtonV2
	extends ComponentSync<Props, State> {

	shouldComponentUpdate(): boolean {
		return true;
	}

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.disabled = nextProps.disabled;

		if (exists(nextProps.actionInProgress))
			state.actionInProgress = nextProps.actionInProgress;

		return state;
	}

	private handleAction = (e: React.MouseEvent<HTMLDivElement>) => {
		// skip action if needed
		if (this.state.disabled || this.state.actionInProgress)
			return;

		// call the action, the response can be both promise or sync void
		const result = this.props.onClick?.(e) as Promise<void> | void;

		// if result is not a promise return
		if (!(result instanceof Promise)) {
			return;
		}

		// in case the result is from type promise and needs to be awaited, await and handle errors
		this.setState({actionInProgress: true}, async () => {
			try {
				await result;
			} catch (error: any) {
				this.logError(error);
				throw error;
			} finally {
				if (!this.props.actionInProgress)
					this.setState({actionInProgress: false});
			}
		});
	};

	private prepareProps = () => {
		const {variant, actionInProgress, ...restOfProps} = this.props;
		const _actionInProgress = this.state.actionInProgress;
		const currentProps: any = {...restOfProps};

		//add on click
		currentProps.onClick = this.handleAction;

		// add variant if exists
		if (variant)
			currentProps['data-variant'] = variant;

		// get updated class name
		currentProps.className = _className('ts-button-v2', this.props.className, this.state.disabled && 'disabled', _actionInProgress && 'action-in-progress');

		return currentProps;
	};

	render() {
		return <div {...this.prepareProps()}>
			{this.state.actionInProgress ? resolveContent(this.props.loaderOverride ??
                <TS_ButtonLoader/>) : this.props.children}
		</div>;
	}
}

