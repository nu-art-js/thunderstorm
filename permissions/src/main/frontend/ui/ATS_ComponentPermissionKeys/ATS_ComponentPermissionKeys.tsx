import * as React from 'react';
import {
	AppToolsScreen,
	LL_V_L,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent
} from '@nu-art/thunderstorm/frontend';
import {PermissionKeysEditor} from './permission-keys-editor';


type State = State_SmartComponent & { selectedProjectId?: string };

type Props = Props_SmartComponent;

export class ATS_ComponentPermissionKeys
	extends SmartComponent<Props, State> {

	static screen: AppToolsScreen = {
		key: 'component-permission-keys',
		name: 'Component Permission Keys',
		renderer: this,
		group: 'Permissions'
	};

	//######################### Life Cycle #########################

	protected async deriveStateFromProps(nextProps: Props, state: State) {
		state ??= (this.state ? {...this.state} : {}) as State;
		return state;
	}

	//######################### Render #########################

	render() {
		return <LL_V_L className={''}>
			<PermissionKeysEditor/>
		</LL_V_L>;
	}
}