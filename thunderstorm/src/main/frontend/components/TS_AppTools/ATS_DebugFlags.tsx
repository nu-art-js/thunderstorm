import * as React from 'react';
import {FirebaseAnalyticsModule} from '@nu-art/firebase/frontend';
import {LogLevelOrdinal, sortArray} from '@nu-art/ts-common';
import {TS_DropDown} from '../TS_Dropdown';
import {SimpleListAdapter} from '../adapter/Adapter';
import {TS_PropRenderer} from '../TS_PropRenderer';
import {AppToolsScreen} from './types';
import {LL_V_L} from '../Layouts';
import {ComponentSync} from '../../core';
import {DebugFlags} from '@nu-art/ts-common/core/DebugFlags';


type ATS_DebugFlags_Props = {
	//
};
type ATS_DebugFlags_State = {
	//
};

export class ATS_DebugFlags
	extends ComponentSync<ATS_DebugFlags_Props, ATS_DebugFlags_State> {

	static screen: AppToolsScreen = {name: `DevTool - DebugFlags`, renderer: this};

	static defaultProps = {
		modules: [],
		pageTitle: () => this.screen.name
	};

	constructor(p: {}) {
		super(p);
		// @ts-ignore
		FirebaseAnalyticsModule.setCurrentScreen(this.pageTitle);
	}

	protected deriveStateFromProps(nextProps: ATS_DebugFlags_Props, state?: Partial<ATS_DebugFlags_State>) {
		return {};
	}

	render() {

		const debugKeys = DebugFlags.listFlags();
		const keys = sortArray(debugKeys, key => key);
		return <LL_V_L className="scrollable-y match_height">
			{keys.map(debugKey => {
				const flags = DebugFlags.persistentState.get(debugKey);
				return <TS_PropRenderer.Vertical label={debugKey}>
					<TS_DropDown
						selected={flags.logLevel}
						adapter={SimpleListAdapter(LogLevelOrdinal, (level) => <>{level.item}</>)}
						onSelected={logLevel => DebugFlags.persistentState.set(debugKey, {logLevel})}
					/>
				</TS_PropRenderer.Vertical>;
			})}
		</LL_V_L>;
	}
}

