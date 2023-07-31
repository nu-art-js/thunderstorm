import * as React from 'react';
import './ATS_AccountEditor.scss';
import {AppToolsScreen, ComponentAsync} from '@nu-art/thunderstorm/frontend';


type State = {};

export class ATS_AccountEditor
	extends ComponentAsync<{}, State> {

	static screen: AppToolsScreen = {name: 'Accounts Editor', key: 'user-account', renderer: this, group: 'TS Dev Tools'};

	// ######################### Life Cycle #########################

	protected async deriveStateFromProps(nextProps: {}) {
		const state: State = this.state ? {...this.state} : {} as State;
		return state;
	}

	// ######################### Logic #########################

	render() {
		return <div className={'refactoring-actions-page'}>
			ACCOUNTS EDITOR
		</div>;
	}
}