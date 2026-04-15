import {__stringify} from '@nu-art/ts-common';
import {ModuleFE_Account} from '../_entity/account/ModuleFE_Account.js';
import {ComponentSync, LL_V_L, TS_Input, TS_TextArea} from '@nu-art/thunder-widgets';
import {AppToolsScreen} from '@nu-art/thunder-ui-modules';
import {OnStorageKeyChangedListener} from '@nu-art/thunder-core';

type ATS_SessionData_Props = {};

type ATS_SessionData_State = {
	sessionId?: string
};

export class ATS_SessionData
	extends ComponentSync<ATS_SessionData_Props, ATS_SessionData_State>
	implements OnStorageKeyChangedListener {

	static screen: AppToolsScreen = {name: `SessionData`, renderer: this, group: 'Permissions'};

	static defaultProps = {
		modules: [],
		pageTitle: () => this.screen.name
	};

	protected deriveStateFromProps(nextProps: ATS_SessionData_Props, state: ATS_SessionData_State): ATS_SessionData_State {
		state = this.state ?? {};
		return state as ATS_SessionData_State;
	}

	constructor(p: ATS_SessionData_Props) {
		super(p);
	}

	async __onStorageKeyEvent(event: StorageEvent) {
		this.forceUpdate();
	}

	private getDecodedSessionId() {
		try {
			if (this.state.sessionId && this.state.sessionId.length) { // @ts-ignore
				return __stringify(ModuleFE_Account.decode(this.state.sessionId), true);
			}
			// @ts-ignore
			return __stringify(ModuleFE_Account.sessionData, true);
		} catch (e) {
			// @ts-ignore
			return __stringify(ModuleFE_Account.sessionData, true);
		}

	}

	render() {
		const sessionDataAsJson = this.getDecodedSessionId();
		return <LL_V_L className={'match_parent'}>
			<TS_Input type={'text'} onBlur={(value) => {
				this.setState({sessionId: value});
			}}/>
			<TS_TextArea style={{fontFamily: 'monospace', fontSize: 15}} type="text" value={sessionDataAsJson}
									 disabled/>
		</LL_V_L>;
	}
}

