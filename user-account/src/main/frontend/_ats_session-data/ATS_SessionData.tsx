import * as React from 'react';
import {__stringify} from '@nu-art/ts-common';
import {ModuleFE_Account} from '../modules/ModuleFE_Account';
import {AppToolsScreen, ComponentSync, Props_SmartComponent, State_SmartComponent, TS_TextArea} from '@nu-art/thunderstorm/frontend';


type ATS_SessionData_Props = {
	//
};
type ATS_SessionData_State = {
	//
};

export class ATS_SessionData
	extends ComponentSync<ATS_SessionData_Props, ATS_SessionData_State> {

	static screen: AppToolsScreen = {name: `DevTool - SessionData`, renderer: this, group: 'Permissions'};

	static defaultProps = {
		modules: [],
		pageTitle: () => this.screen.name
	};

	protected async deriveStateFromProps(nextProps: ATS_SessionData_Props & Props_SmartComponent, state?: (Partial<ATS_SessionData_State> & State_SmartComponent) | undefined): Promise<ATS_SessionData_State & State_SmartComponent> {
		return {} as ATS_SessionData_State & State_SmartComponent;
	}

	constructor(p: ATS_SessionData_Props) {
		super(p);
	}

	render() {
		// @ts-ignore
		const sessionDataAsJson = __stringify(ModuleFE_Account.sessionData, true);
		return <TS_TextArea style={{fontFamily: 'monospace', fontSize: 15}} type="text" value={sessionDataAsJson} disabled/>;
	}
}

