import * as React from 'react';
import {ComponentSync} from '../../_core/ComponentSync.js';
import {exists, isPromise, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import '../Button.scss';
import {_className} from '@nu-art/thunder-core';
import {LL_H_C} from '../../layouts/index.js';

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

	private getClassName = () => {
		return _className('ts-button', this.props.className, this.state.actionInProgress && 'action-in-progress');
	};
	private getProps = () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const {loader, variant, innerRef, onDisabledClick, actionInProgress, ...rest} = this.props;
		const props = rest as any;
		props.className = this.getClassName();
		props.disabled = this.state.disabled;
		props.ref = innerRef;
		props['data-variant'] = variant ?? 'tertiary';
		return props as React.HTMLProps<HTMLButtonElement>;
	};
	private handleAction = async (e: React.MouseEvent<HTMLButtonElement>) => {
		if (this.state.actionInProgress)
			return;
		if (this.state.disabled)
			return this.props.onDisabledClick?.(e);
		const result = this.props.onClick?.(e) as Promise<void> | void;
		if (!isPromise(result))
			return;
		const controlledInProgress = exists(this.props.actionInProgress);
		if (!controlledInProgress) {
			// @ts-ignore - prevents race conditions
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
				this.state.actionInProgress = false;
				this.forceUpdate();
			}
		}
	};

	render() {
		return <button {...this.getProps()} type={'button'} onClick={this.handleAction}>
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

export const TS_Button = Button;
