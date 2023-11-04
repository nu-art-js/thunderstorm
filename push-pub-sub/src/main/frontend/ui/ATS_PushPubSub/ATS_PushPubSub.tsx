import * as React from 'react';
import {AppToolsScreen, CellRenderer, ComponentSync, TS_BusyButton, TS_Button, TS_Input, TS_Table} from '@nu-art/thunderstorm/frontend';
import {__stringify, removeFromArrayByIndex, TS_Object,} from '@nu-art/ts-common';
import {ModuleFE_PushPubSub, OnPushMessageReceived} from '../../modules/ModuleFE_PushPubSub';
import {DB_Notifications} from '../../../shared';


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

function createNewInstance() {
	return {key: '', value: ''};
}

export class ATS_PushPubSub
	extends ComponentSync<Props, State>
	implements OnPushMessageReceived {

	static screen: AppToolsScreen = {name: `DevTool - PushPubSub`, renderer: this};

	constructor(p: Props) {
		super(p);
	}

	protected deriveStateFromProps(nextProps: Props): State | undefined {
		return {
			registerKey: '',
			registerProps: [createNewInstance()],
			triggerKey: '',
			triggerProps: [createNewInstance()],
		};
	}

	__onMessageReceived(notification: DB_Notifications<any>): void {
		console.log('GOT PUSH:', notification.pushKey, notification.props, notification.data);
	}

	render() {
		console.log("ZE ZEVEL")
		return <div className="ll_h_t">
			{ModuleFE_PushPubSub.isNotificationEnabled() ? 'Notification Enabled' :
				<TS_Button onClick={ModuleFE_PushPubSub.requestPermissions}>request permissions</TS_Button>}
			<div>{this.renderTable('Register', this.state.registerProps, 'registerKey', this.subscribe)}</div>
			<div style={{margin: '4px'}}/>
			<div>{this.renderTable('Trigger', this.state.triggerProps, 'triggerKey', this.trigger)}</div>
			<TS_BusyButton onClick={ModuleFE_PushPubSub.deleteToken}>Delete Token</TS_BusyButton>
		</div>;
	}

	private trigger = async () => {
		const props = this.state.triggerProps.reduce((toRet, item) => {
			if (!!item.key && item.key !== '')
				toRet[item.key] = item.value;
			return toRet;
		}, {} as TS_Object);
		const data = {'a': 'aaa'};

		const message = {topic: this.state.triggerKey, props, data};
		this.logInfo(`triggering push: ${__stringify(message, true)}`);
		await ModuleFE_PushPubSub.v1.test({message: message}).executeSync();
	};

	private subscribe = async () => {
		await ModuleFE_PushPubSub.v1.register({
			pushKey: this.state.registerKey,
			props: this.state.registerProps.reduce((toRet, item) => {
				if (!!item.key && item.key !== '')
					toRet[item.key] = item.value;
				return toRet;
			}, {} as TS_Object)
		}).executeSync();
	};

	private renderTable(title: string, rows: ObjProps[], key: 'registerKey' | 'triggerKey', action: () => Promise<void>) {
		const cellRenderer: CellRenderer<ObjProps, Actions> = (prop, item, index: number) => {
			if (prop === 'delete')
				return <TS_Button onClick={() => {
					removeFromArrayByIndex(rows, index);
					this.forceUpdate();
				}}>Delete Row</TS_Button>;

			return this.renderInput(`${key}-${prop}-${index}`, item[prop], (value: string) => {
				item[prop] = value;
				this.forceUpdate();
			});
		};

		const addNewRow = () => {
			rows[rows.length] = createNewInstance();
			this.forceUpdate();
		};

		return <div className="ll_v_l">
			{this.title(title)}
			{this.renderInputWithLabel(key, key, this.state[key], (value) => this.setState({[key]: value} as unknown as State))}
			{<TS_Table<ObjProps, Actions>
				id={key}
				header={['key', 'value', 'delete']}
				rows={rows}
				headerRenderer={columnKey => <div>{columnKey}</div>}
				cellRenderer={cellRenderer}
				tr={{style: {padding: '5px'}}}
			/>}
			<TS_Button onClick={addNewRow}>Add</TS_Button>
			<TS_BusyButton onClick={action}>Send</TS_BusyButton>
		</div>;
	}

	title(title: string): React.ReactNode {
		return <div>{title}</div>;
	}

	private renderInput(id: string, value: string | number, onChange: (value: string, id: string) => void) {
		return <div className="ll_v_l">
			<TS_Input
				onChange={onChange}
				type="text"
				id={id}
				style={{border: '1px solid black'}}
				value={value.toString()}/>
		</div>;
	}

	private renderInputWithLabel(label: string, id: string, value: string, onChange: (value: string, id: string) => void) {
		return <div className="ll_v_l">
			<div style={{marginBottom: '4px'}}>{label}</div>
			<TS_Input
				onChange={onChange}
				type="text"
				id={id}
				style={{border: '1px solid black'}}
				value={value}/>
		</div>;
	}
}

