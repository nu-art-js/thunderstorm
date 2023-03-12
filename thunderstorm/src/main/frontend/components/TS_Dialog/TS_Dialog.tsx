import * as React from 'react';
import './TS_Dialog.scss';
import {BadImplementationException, TypedMap} from '@nu-art/ts-common';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_BusyButton} from '../TS_BusyButton';
import {TS_Button} from '../TS_Button';
import {LL_V_L, ModuleFE_Dialog, TS_ErrorBoundary} from '../..';

export type DialogButton = {
	content: React.ReactNode;
	onClick?: () => void | Promise<void>;
	busy?: boolean;
	className?: string;
	associatedKeys?: string[];
	disabled?: boolean;
}


export abstract class TS_Dialog<P, S>
	extends ComponentSync<P, S> {

	// ######################## Life Cycle ########################

	componentDidMount() {
		const dialog = document.getElementById(this.dialogId);
		dialog?.focus();
	}

	// ######################## KeyMap ########################

	protected readonly keyActionMap: TypedMap<React.RefObject<any>> = {};

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

		if (e.key === 'Escape')
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