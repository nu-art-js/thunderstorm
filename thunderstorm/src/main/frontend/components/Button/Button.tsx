import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import {ResolvableContent, exists, resolveContent} from '@nu-art/ts-common';
import './Button.scss';
import {_className} from '../../utils/tools';
import {LL_H_C} from '../Layouts';

type ButtonVariant = 'primary' | 'secondary' | 'tertiary' | 'text' | 'dangerous';
type ButtonProps = Omit<React.HTMLProps<HTMLButtonElement>, 'type' | 'ref'>;

type Props = ButtonProps & {
	loader?: ResolvableContent<React.ReactNode>;
	variant?: ButtonVariant | string;
	innerRef?: React.RefObject<HTMLButtonElement>;
	actionInProgress?: boolean;
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
		const {loader, variant, innerRef, ...rest} = this.props;
		const props = rest as any;
		props.className = this.getClassName();
		props.disabled = this.state.disabled;
		props.ref = innerRef;
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
		if (!(result instanceof Promise))
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
		return <LL_H_C className={'ts-button-v3__content'}>
			{this.props.children}
		</LL_H_C>;
	};

	private renderLoader = () => {
		if (this.props.loader)
			return resolveContent(this.props.loader);

		return <div className={'ts-button-v3__loader'}/>;
	};
}

export const TS_Button = Button;
export const TS_BusyButton = Button;