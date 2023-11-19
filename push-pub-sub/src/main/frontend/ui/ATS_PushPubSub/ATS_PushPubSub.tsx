import * as React from 'react';
import {
	_className,
	AppToolsScreen,
	ATS_Fullstack,
	CellRenderer,
	LL_H_C,
	LL_H_T,
	LL_V_L,
	ModuleFE_Toaster,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent,
	TS_BusyButton,
	TS_Button,
	TS_Input,
	TS_PropRenderer,
	TS_Table
} from '@nu-art/thunderstorm/frontend';
import {__stringify, DateTimeFormat_yyyyMMDDTHHmmss, groupArrayBy, removeFromArrayByIndex, TS_Object,} from '@nu-art/ts-common';
import {TS_Icons} from '@nu-art/ts-styles';
import {ModuleFE_PushPubSub, OnPushMessageReceived} from '../../modules/ModuleFE_PushPubSub';
import {PushMessage_Payload} from '../../../shared';
import './ATS_PushPubSub.scss';
import {TS_InputV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_Input';
import {ModuleFE_PushSubscription} from '../../modules/ModuleFE_PushSubscription';
import {ApiCallerEventTypeV3} from '@nu-art/thunderstorm/frontend/core/db-api-gen/v3_types';
import {DBProto_PushSubscription} from '../../../shared/push-subscription';


type ObjProps = {
	key: string
	value: string
}

type Actions = 'delete'

type State = {
	registerKey: string,
	registerFilter: ObjProps[]
	triggerKey: string,
	triggerFilter: ObjProps[]

	receivedPushPayloads: PushMessage_Payload[]
}

type Props = {}

function createNewInstance(key = '', value = '') {
	return {key, value};
}

const ConfigPreset_1 = {
	label: 'Matching simple',
	config: {
		registerKey: 'test-key',
		registerFilter: [createNewInstance('prop-key', 'value1')],
		triggerKey: 'test-key',
		triggerFilter: [createNewInstance('prop-key', 'value1')],
	}
};

export class ATS_PushPubSub
	extends SmartComponent<Props, State>
	implements OnPushMessageReceived {

	static screen: AppToolsScreen = {name: `Push Messages`, renderer: this, group: ATS_Fullstack};
	static defaultProps = {
		modules: [ModuleFE_PushSubscription]
	};

	constructor(p: Props) {
		super(p);
	}

	protected async deriveStateFromProps(nextProps: Props_SmartComponent & Props, _state: (Partial<State> & State_SmartComponent) | undefined): Promise<State_SmartComponent & State> {
		const state = _state ?? {} as State_SmartComponent & State;

		return {...state, ...ConfigPreset_1.config, receivedPushPayloads: []};
	}

	__onSubscriptionUpdated(...params: ApiCallerEventTypeV3<DBProto_PushSubscription>): void {
		this.forceUpdate();
	}

	__onMessageReceived(payload: PushMessage_Payload): void {
		console.log('GOT PUSH:', payload.message.topic, payload.message.props, payload.message.data);
		this.setState({receivedPushPayloads: [...this.state.receivedPushPayloads, payload]});
	}

	render() {
		const className = _className('notification-icon', ModuleFE_PushPubSub.isNotificationEnabled() ? 'notification-enabled' : 'notification-disabled',);
		const mySubscription = ModuleFE_PushSubscription.cache.all()
			.filter(subscription => subscription.pushSessionId === ModuleFE_PushPubSub.getPushSessionId());

		return <LL_V_L className="ats-PushPubSub">
			<LL_H_C>Push Session Id: {ModuleFE_PushPubSub.getPushSessionId()}</LL_H_C>
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
				{this.renderPanel('Register', this.state.registerFilter, 'registerKey', this.subscribe)}
				{this.renderPanel('Trigger', this.state.triggerFilter, 'triggerKey', this.trigger)}
			</LL_H_T>
			<LL_H_T className="panels-container h-gap__n match_width">
				<LL_V_L className="panel v-gap__l">
					{groupArrayBy(mySubscription, (subscription) => subscription.topic)
						.map((subscription, index) => <LL_H_C key={index}>
							<LL_H_C style={{width: 100}}>{subscription.key}</LL_H_C>
							<LL_V_L>{subscription.values.map((value, index) => <LL_H_C key={index}><TS_Icons.bin.component
								onClick={() => ModuleFE_PushSubscription.v1.delete({_id: value._id}).executeSync()}/>{JSON.stringify(value.filter)}</LL_H_C>)}</LL_V_L>
						</LL_H_C>)}
				</LL_V_L>
				<LL_V_L className="panel">
					{this.state.receivedPushPayloads.map(payload => <LL_H_C>
						<span style={{width: 200}}>{DateTimeFormat_yyyyMMDDTHHmmss.format(payload.timestamp)}</span>
						{JSON.stringify(payload.message)}
					</LL_H_C>)}
				</LL_V_L>
			</LL_H_T>
		</LL_V_L>;
	}

	private composeFilter(objProps: ObjProps[]) {
		return objProps.reduce((toRet, item) => {
			if (!!item.key && item.key !== '')
				toRet[item.key] = item.value;
			return toRet;
		}, {} as TS_Object);
	}

	private trigger = async () => {
		if (!ModuleFE_PushPubSub.hasToken())
			return ModuleFE_Toaster.toastError('No push token generated');

		const filter = this.composeFilter(this.state.triggerFilter);
		const data = {'a': 'aaa'};

		const message = {topic: this.state.triggerKey, filter, data};
		this.logInfo(`triggering push: ${__stringify(message, true)}`);
		await ModuleFE_PushPubSub.v1.test({message}).executeSync();
	};

	private subscribe = async () => {
		if (!ModuleFE_PushPubSub.hasToken())
			return ModuleFE_Toaster.toastError('No push token generated');

		await ModuleFE_PushPubSub.v1.register({
			topic: this.state.registerKey,
			filter: this.composeFilter(this.state.registerFilter)
		}).executeSync();

		await ModuleFE_PushSubscription.v1.sync().executeSync();
	};

	private renderPanel(title: string, rows: ObjProps[], key: 'registerKey' | 'triggerKey', action: () => Promise<void>) {
		const cellRenderer: CellRenderer<ObjProps, Actions> = (prop, item, index: number) => {
			if (prop === 'delete')
				return <TS_Icons.bin.component onClick={() => {
					removeFromArrayByIndex(rows, index);
					this.forceUpdate();
				}}>Delete Row</TS_Icons.bin.component>;

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
					header={['key', 'value', {header: 'delete', widthPx: 30}]}
					rows={rows}
					headerRenderer={columnKey => <div>{columnKey === 'delete' ? '' : columnKey}</div>}
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

