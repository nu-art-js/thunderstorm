import * as React from 'react';
import './TS_Dialog.scss';
import {BadImplementationException, TypedMap} from '@nu-art/ts-common';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_BusyButton} from '../TS_BusyButton';
import {TS_Button} from '../TS_Button';
import {LL_V_L, ModuleFE_Dialog, TS_ErrorBoundary} from '../..';

/**
 * ###DialogButton
 *
 * Type defining the properties for a dialog button passed on to TS_Dialog.
 */
export type DialogButton = {
	content: React.ReactNode;
	onClick?: () => void | Promise<void>;
	busy?: boolean;
	className?: string;
	associatedKeys?: string[];
	disabled?: boolean;
}

/**
 * Base state for TS_Dialog
 */
export type State_TSDialog = {
	dialogIsBusy?: boolean;
};

/**
 * ##TS_Dialog
 *
 * This class defines the logic and render behavior for dialogs in the system.
 * Any dialog class in the system is meant to inherit this class to utilize its features.
 */
export abstract class TS_Dialog<P, S extends State_TSDialog>
	extends ComponentSync<P, S> {

	// ######################## Life Cycle ########################

	componentDidMount() {
		const dialog = document.getElementById(this.dialogId);
		dialog?.focus();
	}

	// ######################## KeyMap ########################

	/**
	 * A map held per instance connecting a (keyboard)key to a dialog button.
	 * This map is filled in by calling _keyActionMapCreator with buttons.
	 * @protected
	 */
	protected readonly keyActionMap: TypedMap<React.RefObject<any>> = {};

	/**
	 * A function to fill in keyActionMap.
	 *
	 * This function receives an array of buttons and for each button will connect any associated
	 * keys to the button, to be used by dialogKeyEventHandler.
	 *
	 * Keep in mind:
	 *
	 * 1. If an associated key is found in more than one button, an error will be thrown.
	 *
	 * 2. This function must be called in the constructor of the inheriting class.
	 *
	 * @param buttons - an array of buttons of type DialogButton
	 */
	protected _keyActionMapCreator = (buttons: DialogButton[]) => {
		buttons.forEach(button => {
			if (!button.associatedKeys?.length)
				return;

			const ref = React.createRef<HTMLDivElement>();
			button.associatedKeys.forEach(key => {
				if (this.keyActionMap[key])
					throw new BadImplementationException(`Trying to assign action to key ${key} more than once`);
				this.keyActionMap[key] = ref;
			});
		});
	};

	private dialogKeyEventHandler = (e: React.KeyboardEvent) => {
		e.persist();

		if (e.key === 'Escape' && !this.state.dialogIsBusy)
			this.closeDialog();

		this.keyActionMap[e.key]?.current?.click();
	};

	// ######################## Utils ########################

	protected _buttonsCreator = (buttons?: DialogButton[]) => {
		if (!buttons?.length)
			return undefined;

		return <>
			{buttons.map((button, i) => {
				const ref = button.associatedKeys ? this.keyActionMap[button.associatedKeys[0]] : undefined;
				return button.busy ?
					<TS_BusyButton
						className={button.className}
						innerRef={ref}
						onClick={async () => await button.onClick?.()}
						disabled={button.disabled}
						key={`button-${i}`}
					>{button.content}</TS_BusyButton>
					: <TS_Button
						className={button.className}
						ref={ref}
						onClick={button.onClick}
						disabled={button.disabled}
						key={`button-${i}`}
					>{button.content}</TS_Button>;
			})}
		</>;
	};

	protected closeDialog = () => {
		ModuleFE_Dialog.close();
	};

	// ######################## Abstract ########################

	protected abstract dialogId: string;
	protected abstract dialogLeftButtons: () => (DialogButton[] | undefined);
	protected abstract dialogRightButtons: () => (DialogButton[] | undefined);
	protected abstract dialogHeader: () => React.ReactNode;
	protected abstract dialogMain: () => React.ReactNode;

	// ######################## Render ########################

	private renderHeader = () => {
		const headerContent = this.dialogHeader();
		if (!headerContent)
			return '';

		return <div className={'ts-dialog__header'}>
			{headerContent}
		</div>;
	};

	private renderButtons = () => {
		const leftContent = this._buttonsCreator(this.dialogLeftButtons());
		const rightContent = this._buttonsCreator(this.dialogRightButtons());
		return <div className={'ts-dialog__buttons'}>
			<div className={'ts-dialog__buttons__left'}>{leftContent}</div>
			<div className={'ts-dialog__buttons__right'}>{rightContent}</div>
		</div>;
	};

	private renderMain = () => {
		const mainContent = this.dialogMain();
		if (!mainContent)
			return '';

		return <div className={'ts-dialog__main'}>
			{mainContent}
		</div>;
	};

	render() {
		return <TS_ErrorBoundary>
			<LL_V_L className={'ts-dialog'} id={this.dialogId} tabIndex={-1} onKeyDown={this.dialogKeyEventHandler}>
				{this.renderHeader()}
				{this.renderMain()}
				{this.renderButtons()}
			</LL_V_L>
		</TS_ErrorBoundary>;
	}
}