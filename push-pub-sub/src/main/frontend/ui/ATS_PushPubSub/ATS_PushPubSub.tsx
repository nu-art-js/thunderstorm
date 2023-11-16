import * as React from 'react';
import {
	_className,
	AppToolsScreen,
	ATS_Fullstack,
	CellRenderer,
	ComponentSync, LL_H_C, LL_H_T, LL_V_L, ModuleFE_Toaster,
	TS_BusyButton,
	TS_Button,
	TS_Input, TS_PropRenderer,
	TS_Table
} from '@nu-art/thunderstorm/frontend';
import {__stringify, removeFromArrayByIndex, TS_Object,} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_PushPubSub, OnPushMessageReceived} from '../../modules/ModuleFE_PushPubSub';
import {DB_Notifications} from '../../../shared';
import './ATS_PushPubSub.scss';
import {TS_InputV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_Input';


type ObjProps = {
	key: string
	value: string
}

type Actions = 'delete'

type State = {
	registerKey: string,
	registerProps: ObjProps[]
	triggerKey: string,
	triggerProps: ObjProps[]
}

type Props = {}

function createNewInstance(key = '', value = '') {
	return {key, value};
}

const ConfigPreset_1 = {
	label: 'Matching simple',
	config: {
		registerKey: 'test-key',
		registerProps: [createNewInstance('prop-key', 'value1')],
		triggerKey: 'test-key',
		triggerProps: [createNewInstance('prop-key', 'value1')],
	}
};


export class ATS_PushPubSub
	extends ComponentSync<Props, State>
	implements OnPushMessageReceived {

	static screen: AppToolsScreen = {name: `Push Messages`, renderer: this, group: ATS_Fullstack};

	constructor(p: Props) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props): State | undefined {
		return ConfigPreset_1.config;
	}

	__onMessageReceived(notification: DB_Notifications<any>): void {
		console.log('GOT PUH:', notification.pushKey, notification.props, notification.data);
	}

	render() {
		const className = _className('notification-icon', ModuleFE_PushPubSub.isNotificationEnabled() ? 'notification-enabled' : 'notification-disabled',);
		return <LL_V_L className="ats-PushPubSub">
			<LL_H_C className="header match_width">
				<div>{TS_Icons.bell.component({
					className: className,
					onClick: async (e) => {
						await ModuleFE_PushPubSub.requestPermissions();
					}
				})}</div>
				<TS_BusyButton onClick={ModuleFE_PushPubSub.deleteToken}>Delete Token</TS_BusyButton>
				<TS_BusyButton onClick={ModuleFE_PushPubSub.getToken}>Generate Token</TS_BusyButton>
			</LL_H_C>
			<LL_H_T className="panels-container h-gap__n match_width">
				{this.renderPanel('Register', this.state.registerProps, 'registerKey', this.subscribe)}
				{this.renderPanel('Trigger', this.state.triggerProps, 'triggerKey', this.trigger)}
			</LL_H_T>
		</LL_V_L>;
	}

	private composeProps(objProps: ObjProps[]) {
		return objProps.reduce((toRet, item) => {
			if (!!item.key && item.key !== '')
				toRet[item.key] = item.value;
			return toRet;
		}, {} as TS_Object);
	}

	private trigger = async () => {
		if (!ModuleFE_PushPubSub.hasToken())
			return ModuleFE_Toaster.toastError('No push token generated');

		const props = this.composeProps(this.state.triggerProps);
		const data = {'a': 'aaa'};

		const message = {topic: this.state.triggerKey, props, data};
		this.logInfo(`triggering push: ${__stringify(message, true)}`);
		await ModuleFE_PushPubSub.v1.test({message: message}).executeSync();
	};

	private subscribe = async () => {
		if (!ModuleFE_PushPubSub.hasToken())
			return ModuleFE_Toaster.toastError('No push token generated');

		await ModuleFE_PushPubSub.v1.register({
			pushKey: this.state.registerKey,
			props: this.composeProps(this.state.registerProps)
		}).executeSync();
	};

	private renderPanel(title: string, rows: ObjProps[], key: 'registerKey' | 'triggerKey', action: () => Promise<void>) {
		const cellRenderer: CellRenderer<ObjProps, Actions> = (prop, item, index: number) => {
			if (prop === 'delete')
				return <TS_Button onClick={() => {
					removeFromArrayByIndex(rows, index);
					this.forceUpdate();
				}}>Delete Row</TS_Button>;

			return <TS_Input
				onChange={(value: string) => {
					item[prop] = value;
					this.forceUpdate();
				}}
				className={'match_width'}
				type="text"
				placeholder={`Enter ${prop}`}
				id={`${key}-${prop}-${index}`}
				value={item[prop].toString()}/>;

		};

		const addNewRow = () => {
			rows[rows.length] = createNewInstance();
			this.forceUpdate();
		};

		return <LL_V_L className="panel">
			<LL_H_C className="panel-header match_width flex__justify-center">
				{title}
				<TS_Button onClick={addNewRow}>Add</TS_Button>
				<TS_BusyButton onClick={action}>Send</TS_BusyButton>
			</LL_H_C>
			<LL_V_L className="panel-content v-gap__n">
				<TS_PropRenderer.Vertical label={'Key'}>
					<TS_InputV2
						onChange={(value) => this.setState({[key]: value} as unknown as State)}
						type="text"
						id={key}
						value={this.state[key]}/>
				</TS_PropRenderer.Vertical>

				{<TS_Table<ObjProps, Actions>
					id={key}
					table={{className: 'match_width'}}
					header={['key', 'value', 'delete']}
					rows={rows}
					headerRenderer={columnKey => <div>{columnKey}</div>}
					cellRenderer={cellRenderer}
					tr={{style: {padding: '5px'}}}
				/>}
			</LL_V_L>
		</LL_V_L>;
	}

	title(title: string): React.ReactNode {
		return <div>{title}</div>;
	}

}

