import * as React from 'react';
import {
	AppToolsScreen,
	LL_H_C,
	LL_V_L,
	Props_SmartComponent,
	SmartComponent,
	State_SmartComponent,
	TS_AppTools,
	TS_Button
} from '@nu-art/thunderstorm/frontend';
import './ATS_Permissions.scss';
import {ModuleFE_PermissionsAssert} from '../../modules/ModuleFE_PermissionsAssert';


type State = State_SmartComponent;

type Props = Props_SmartComponent;

export class ATS_AssertPermissions
	extends SmartComponent<Props, State> {

	static screen: AppToolsScreen = {
		key: 'permissions assert',
		name: 'Assert Permissions',
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
		return <LL_V_L id={'dev-page__permissions'}>
			<LL_H_C className="match_width flex__space-between">{TS_AppTools.renderPageHeader('Permissions Editor')}
				<TS_Button className={'item-list__add-button'} onClick={async () => await ModuleFE_PermissionsAssert
					.v1.createProject({}).executeSync()}>Create Project</TS_Button>
			</LL_H_C>
		</LL_V_L>;
	}
}