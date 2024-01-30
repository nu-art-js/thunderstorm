import './TS_SimpleDialog.scss';
import {DialogButtons, Props_TSDialog, TS_Dialog} from './TS_Dialog';
import {ModuleFE_Dialog} from '../../component-modules/ModuleFE_Dialog';
import * as React from 'react';


type State = {}

type Props_SimpleDialog = {
	title: React.ReactNode,
	body: React.ReactNode,
	negativeButtonProps: {
		label: string
		action?: () => Promise<any> | void
	}
	actionButtonProps: {
		label: string
		action: () => Promise<any>
	}
};

export class TS_SimpleDialog
	extends TS_Dialog<Props_SimpleDialog, State> {

	static defaultProps = {
		dialogId: 'order-graph',
		className: 'order-graph'
	};

	constructor(p: Props_SimpleDialog & Props_TSDialog) {
		super(p);
	}

	static show(props: Props_SimpleDialog) {
		ModuleFE_Dialog.show(<TS_SimpleDialog {...props}/>);
	}

	protected renderHeader = (): React.ReactNode => this.props.title;
	protected renderBody = (): React.ReactNode => this.props.body;
	protected buttons = (): DialogButtons => {
		return {
			right: [{
				content: this.props.actionButtonProps.label,
				associatedKeys: ['enter'],
				renderer: TS_Dialog.busyButton,
				onClick: async () => {
					await this.props.actionButtonProps.action();
					this.closeDialog();
				},
			}],
			left: [{
				content: this.props.negativeButtonProps.label,
				associatedKeys: ['escape'],
				onClick: async () => {
					await this.props.negativeButtonProps.action?.();
					this.closeDialog();
				},
			}]
		};
	};
}