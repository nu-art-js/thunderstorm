import * as React from 'react';
import './TS_Dialog.scss';
import {_values, BadImplementationException, filterInstances, flatArray, TS_Object, TypedMap} from '@nu-art/ts-common';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_BusyButton} from '../TS_BusyButton';
import {TS_Button} from '../TS_Button';
import {DialogKey, ModuleFE_Dialog} from '../../component-modules/ModuleFE_Dialog';
import {TS_ErrorBoundary} from '../TS_ErrorBoundary';
import {_className, stopPropagation} from '../../utils/tools';
import {LL_V_L} from '../Layouts';


/**
 * ###DialogButton
 *
 * Type defining the properties for a dialog button passed on to TS_Dialog.
 */
export type DialogButton = {
	content: React.ReactNode;
	onClick?: (e: React.KeyboardEvent | React.MouseEvent) => void | Promise<void>;
	onDisabledClick?: (e: React.MouseEvent) => any;
	className?: string;
	associatedKeys?: string[];
	disabled?: boolean;
	renderer?: (button: DialogButton, index: number, ref?: React.RefObject<any>) => React.ReactNode;
}

export type DialogButtons = {
	left?: DialogButton[];
	center?: DialogButton[];
	right?: DialogButton[];
}

/**
 * Base state for TS_Dialog
 */
export type State_TSDialog = {
	dialogIsBusy?: boolean;
	error?: Error
};

/**
 * Base Props for TS_Dialog
 */
export type Props_TSDialog = {
	dialogKey?: string;
	dialogId: string;
	className?: string;
};

/**
 * ##TS_Dialog
 *
 * This class defines the logic and render behavior for dialogs in the system.
 * Any dialog class in the system is meant to inherit this class to utilize its features.
 */
export abstract class TS_Dialog<P extends {} = {}, S extends {} = {}>
	extends ComponentSync<P & Props_TSDialog, S & State_TSDialog> {

	// ######################## Life Cycle ########################
	__consumeDialogCloseEvent(dialogKey: DialogKey) {
		return false;
	}

	componentDidMount() {
		this._keyActionMapCreator();
		const dialog = document.getElementById(this.props.dialogId);
		dialog?.focus();
		this.forceUpdate();
	}

	// ######################## KeyMap ########################

	/**
	 * A map held per instance connecting a (keyboard)key to a dialog button.
	 * This map is filled in by calling _keyActionMapCreator with buttons.
	 * @protected
	 */
	private readonly keyActionMap: TypedMap<React.RefObject<any>> = {};

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
	private _keyActionMapCreator = () => {
		flatArray(filterInstances(_values(this.buttons()))).forEach(button => {
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

	protected deriveStateFromProps(nextProps: P, state: S) {
		return state;
	}

	private dialogKeyEventHandler = (e: React.KeyboardEvent) => {
		e.persist();

		if (e.key === 'Escape' && !this.state.dialogIsBusy)
			this.closeDialog();

		this.keyActionMap[e.key]?.current?.click(e);
	};

	// ######################## Utils ########################

	protected _buttonsCreator = (buttons?: DialogButton[]) => {
		if (!buttons?.length)
			return undefined;

		return <>
			{buttons.map((button, i) => {
				const ref = button.associatedKeys ? this.keyActionMap[button.associatedKeys[0]] : undefined;
				return (button.renderer ?? TS_Dialog.normalButton)(button, i, ref);
			})}
		</>;
	};

	protected closeDialog = (force = false) => {
		ModuleFE_Dialog.close(force, this.props.dialogKey);
	};

	// ######################## Render - Header ########################

	private dialogHeader = (headerContent: React.ReactNode | undefined) => {
		return headerContent && <div className={'ts-dialog__header'}>
			{headerContent}
		</div>;
	};

	protected renderHeader = (): React.ReactNode | undefined => {
		return undefined;
	};

	// ######################## Render - Main ########################

	private dialogBody = (mainContent: React.ReactNode | undefined) => {
		return mainContent && <div className={'ts-dialog__main'}>
			{mainContent}
		</div>;
	};

	protected renderBody = (): React.ReactNode | undefined => {
		return undefined;
	};

	// ######################## Render - Buttons ########################

	private dialogButtons = (buttons: TS_Object) => {
		if (_values(buttons).every(arr => !arr || !arr.length))
			return undefined;

		return <div className={'ts-dialog__buttons'}>
			{buttons.left && <div className={'ts-dialog__buttons__left'}>{this._buttonsCreator(buttons.left)}</div>}
			{buttons.center &&
				<div className={'ts-dialog__buttons__center'}>{this._buttonsCreator(buttons.center)}</div>}
			{buttons.right && <div className={'ts-dialog__buttons__right'}>{this._buttonsCreator(buttons.right)}</div>}
		</div>;
	};

	protected buttons = (): DialogButtons => {
		return {};
	};

	protected performAction = (action: () => Promise<void>) => {
		this.setState({dialogIsBusy: true} as S & State_TSDialog, async () => {
			await action();

			if (this.mounted)
				this.setState({dialogIsBusy: false} as S & State_TSDialog);
		});
	};

	// ######################## Render ########################

	render() {
		let buttons = {};
		let mainContent;
		let headerContent;
		try {
			buttons = this.buttons();
			mainContent = this.renderBody();
			headerContent = this.renderHeader();
		} catch (err: any) {
			if (!this.state.error)
				this.setState({error: err});
		}

		return <TS_ErrorBoundary error={this.state.error} onClick={() => this.closeDialog(true)}>
			<LL_V_L className={_className('ts-dialog', this.props.className)} id={this.props.dialogId} tabIndex={-1}
							onKeyDown={this.dialogKeyEventHandler}
							onClick={stopPropagation}
							onContextMenu={stopPropagation}>
				{this.dialogHeader(headerContent)}
				{this.dialogBody(mainContent)}
				{this.dialogButtons(buttons)}
			</LL_V_L>
		</TS_ErrorBoundary>;
	}

	static busyButton = (button: DialogButton, index: number, ref?: React.RefObject<any>) => {
		return <TS_BusyButton
			className={button.className}
			innerRef={ref}
			onClick={async (e) => await button.onClick?.(e)}
			disabled={button.disabled}
			onDisabledClick={button.onDisabledClick}
			key={`button-${index}`}
		>{button.content}</TS_BusyButton>;
	};

	static normalButton = (button: DialogButton, index: number, ref?: React.RefObject<any>) => {
		return <TS_Button
			className={button.className}
			ref={ref}
			onClick={button.onClick}
			onDisabledClick={button.onDisabledClick}
			disabled={button.disabled}
			key={`button-${index}`}
		>{button.content}</TS_Button>;
	};

	static Button_Cancel = {
		content: 'Cancel',
		onClick: () => ModuleFE_Dialog.close(true),
		associatedKeys: ['Escape']
	};
}