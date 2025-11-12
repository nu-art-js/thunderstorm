import {AppToolsScreen, Button, ComponentSync, LL_V_L, TS_Input, TS_PropRenderer} from '@nu-art/thunderstorm-frontend/index';
import {thunderstormCapabilitiesGroup} from '@nu-art/thunderstorm-frontend/consts';
import * as React from 'react';
import {PageStateManager} from '../../_modules/ModuleFE_AppState.js';
import {md5} from '@nu-art/ts-common';

type State = {
	value_Input?: string;
};

const manager = new PageStateManager<State>(`/app-tools/${md5('App State')}`);

class ATS_AppState_Class
	extends ComponentSync<unknown, State> {

	protected deriveStateFromProps(p: unknown, state: State) {
		state.value_Input ??= manager.value.get('value_Input');
		return state;
	}

	render() {
		return <LL_V_L>
			<TS_PropRenderer.Horizontal label={'Input'}>
				<TS_Input
					type={'text'}
					value={this.state.value_Input}
					onChange={val => {
						this.setState({value_Input: val}, () => manager.value.set('value_Input', val));
					}}/>
			</TS_PropRenderer.Horizontal>
			<Button variant={'primary'} onClick={() => manager.getExportURL()}>
				Export State
			</Button>
		</LL_V_L>;
	}
}

export const ATS_AppState: AppToolsScreen = {
	key: 'ats-app-state',
	name: 'App State',
	renderer: ATS_AppState_Class,
	group: thunderstormCapabilitiesGroup,
};