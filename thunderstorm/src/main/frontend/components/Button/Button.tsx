import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {ResolvableContent, exists, resolveContent} from '@nu-art/ts-common';
import './Button.scss';
import {_className} from '../../utils/tools';
import {LL_H_C} from '../Layouts';

//(string & {}) preserves the literals in autocomplete and allows any other string to be entered
type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'dangerous' | (string & {});
type ButtonProps = Omit<React.HTMLProps<HTMLButtonElement>, 'type' | 'ref'>;

type Props = ButtonProps & {
	loader?: ResolvableContent<React.ReactNode>;
	variant?: ButtonVariant;
	innerRef?: React.RefObject<HTMLButtonElement>;
	actionInProgress?: boolean;
	onDisabledClick?: (e: React.MouseEvent<HTMLButtonElement>) => any;
};

type State = {
	actionInProgress: boolean;
	disabled: boolean;
};

/**
 * Thunderstorm Button component, this component is the de-facto button in our system.</br>
 * This button handles both sync and async actions, and can be autonomous or controlled.</br>
 *
 * @property variant - the variant of the button, will be added to the button element as a "data-variant" attribute.
 * this component comes with 5 default variants ('primary' | 'secondary' | 'tertiary' | 'text' | 'dangerous'), but will accept any string, just make sure to add your own design for it!
 *
 * @property loader - When an async action is fired, the button renders a loader. this property is an overwrite for the loader renderer.
 *
 * @property actionInProgress - If given, the button becomes controlled and will only show a loader if true is passed from the outside.
 */
export class Button
	extends ComponentSync<Props, State> {

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State): State {
		state.actionInProgress ??= false;
		state.disabled = !!nextProps.disabled;
		if (exists(nextProps.actionInProgress))
			state.actionInProgress = nextProps.actionInProgress;
		return state;
	}

	shouldComponentUpdate(): boolean {
		return true;
	}

	//######################### Logic #########################

	private getClassName = () => {
		return _className(
			'ts-button',
			this.props.className,
			this.state.actionInProgress && 'action-in-progress',
		);
	};

	private getProps = () => {
		//Clean out non-html properties from the props
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const {loader, variant, innerRef, onDisabledClick, ...rest} = this.props;
		const props = rest as any;

		//Align props from other sources
		props.className = this.getClassName();
		props.disabled = this.state.disabled;
		props.ref = innerRef;
		props['data-variant'] = variant ?? 'tertiary';
		return props as React.HTMLProps<HTMLButtonElement>;
	};

	private resultIsPromise = (result: any): boolean => {
		//Reliable for any result that is a native promise
		if (result instanceof Promise)
			return true;

		//Reliable for "thenable" objects, any non-native promise copying results
		return (typeof result === 'object' && typeof result.then === 'function');
	};

	private handleAction = async (e: React.MouseEvent<HTMLButtonElement>) => {
		// skip action if needed
		if (this.state.actionInProgress)
			return;

		if (this.state.disabled)
			return this.props.onDisabledClick?.(e);

		// call the action, the response can be both promise or sync void
		const result = this.props.onClick?.(e) as Promise<void> | void;

		// if result is not a promise return
		if (!this.resultIsPromise(result))
			return;

		const controlledInProgress = exists(this.props.actionInProgress);

		// in case the result is from type promise and needs to be awaited, await and handle errors
		if (!controlledInProgress) {
			// @ts-ignore - prevents race conditions
			// noinspection JSConstantReassignment
			this.state.actionInProgress = true;
			this.forceUpdate();
		}

		try {
			await result;
		} catch (error: any) {
			this.logError(error);
			throw error;
		} finally {
			if (!controlledInProgress) {
				// @ts-ignore - prevents race conditions
				// noinspection JSConstantReassignment
				this.state.actionInProgress = false;
				this.forceUpdate();
			}
		}
	};

	//######################### Render #########################

	render() {
		return <button
			{...this.getProps()}
			type={'button'}
			onClick={this.handleAction}
		>
			{this.renderContent()}
			{this.renderLoader()}
		</button>;
	}

	private renderContent = () => {
		return <LL_H_C className={'ts-button__content'}>
			{this.props.children}
		</LL_H_C>;
	};

	private renderLoader = () => {
		if (this.props.loader)
			return resolveContent(this.props.loader);

		return <div className={'ts-button__loader'}/>;
	};
}