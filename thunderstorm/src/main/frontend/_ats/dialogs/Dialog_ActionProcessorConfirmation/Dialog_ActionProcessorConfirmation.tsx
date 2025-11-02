import {functionThatReturnsTrue} from '@nu-art/ts-common';
import {ActionMetaData} from '../../../../shared/action-processor/index.js';
import {ComponentSync} from '../../../core/ComponentSync.js';
import {TS_Icons} from '@nu-art/ts-styles';
import './Dialog_ActionProcessorConfirmation.scss';
import {ModuleFE_Dialog} from '../../../component-modules/ModuleFE_Dialog.js';
import {LL_H_C, LL_V_L} from '../../../components/Layouts/index.js';
import {Button} from '../../../components/Button/Button.js';

type Props = {
	action: ActionMetaData
	onExecute: () => (void | Promise<void>);
}

export class Dialog_ActionProcessorConfirmation
	extends ComponentSync<Props> {

	// ######################### Static #########################

	static show(action: ActionMetaData, onExecute: () => (void | Promise<void>)) {
		ModuleFE_Dialog.show({
			content: <Dialog_ActionProcessorConfirmation action={action} onExecute={onExecute}/>,
			closeOverlayOnClick: functionThatReturnsTrue
		});
	}

	// ######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state?: Partial<any> | undefined) {
	}

	// ######################### Logic #########################

	private closeDialog = () => {
		ModuleFE_Dialog.close(true);
	};

	private executeAction = () => {
		this.props.onExecute();
		this.closeDialog();
	};

	// ######################### Render #########################

	private renderHeader = () => {
		return <LL_H_C className={'dialog__header'}>
			<div className={'dialog__header__title'}>Refactoring Action Conformation</div>
		</LL_H_C>;
	};

	private renderMain = () => {
		return <LL_H_C className={'dialog__main'}>
			<TS_Icons.information.component className={'dialog__main__warning-icon'}/>
			<LL_V_L className={'dialog__main__warning'}>
				<div className={'dialog__main__warning__title'}>Action Description</div>
				<div className={'dialog__main__warning__text'}>{this.props.action.description}</div>
			</LL_V_L>
		</LL_H_C>;
	};

	private renderButtons = () => {
		return <LL_H_C className={'dialog__buttons'}>
			<Button onClick={this.closeDialog}>Cancel</Button>
			<Button onClick={this.executeAction}>Execute</Button>
		</LL_H_C>;
	};

	render() {
		return <LL_V_L className={'dialog-refactoring-action-conformation'}>
			{this.renderHeader()}
			{this.renderMain()}
			{this.renderButtons()}
		</LL_V_L>;
	}
}