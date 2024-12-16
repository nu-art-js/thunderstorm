import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {exists, ResolvableContent, resolveContent} from '@nu-art/ts-common';
import {TS_ButtonLoader} from '../TS_ButtonLoader';
import './Button.scss';
import {_className} from '../../utils/tools';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text';
type ButtonProps = Omit<React.HTMLProps<HTMLButtonElement>, 'type'>;

type Props = ButtonProps & {
	actionInProgress?: boolean;
	loader?: ResolvableContent<React.ReactNode>;
	variant?: ButtonVariant | string;
};

type State = {
	actionInProgress: boolean;
	disabled: boolean;
};

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
			'ts-button-v3',
			this.props.className,
			this.state.actionInProgress && 'action-in-progress',
		);
	};

	private getProps = () => {
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		const {actionInProgress, loader, variant, ...rest} = this.props;
		const props = rest as any;
		props.className = this.getClassName();
		props.disabled = this.state.disabled;
		props['data-variant'] = variant ?? 'tertiary';
		return props as React.HTMLProps<HTMLButtonElement>;
	};

	private handleAction = async (e: React.MouseEvent<HTMLButtonElement>) => {
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
		// @ts-ignore - prevents race conditions
		this.state.actionInProgress = true;
		this.forceUpdate();
		try {
			await result;
		} catch (error: any) {
			this.logError(error);
			throw error;
		} finally {
			if (!this.props.actionInProgress) {
				// @ts-ignore - prevents race conditions
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
		>{this.renderContent()}</button>;
	}

	private renderContent = () => {
		if (!this.state.actionInProgress)
			return this.props.children;

		if (this.props.loader)
			return resolveContent(this.props.loader);

		return <TS_ButtonLoader/>;
	};
}

export const TS_Button = Button;