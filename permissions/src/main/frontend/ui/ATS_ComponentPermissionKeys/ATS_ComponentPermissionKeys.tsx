import * as React from 'react';
import {AppToolsScreen, ComponentSync, LL_V_L} from '@nu-art/thunderstorm/frontend';
import {PermissionKeysEditor} from './subEditors/permission-keys-editor';
import {ModuleFE_PermissionAccessLevel} from '../../_entity';


type State = { selectedProjectId?: string };

type Props = {};

export class ATS_ComponentPermissionKeys
	extends ComponentSync<Props, State> {

	static screen: AppToolsScreen = {
		key: 'component-permission-keys',
		name: 'Component Permission Keys',
		renderer: this,
		group: 'Permissions',
		modulesToAwait: [ModuleFE_PermissionAccessLevel],
	};

	//######################### Life Cycle #########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
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