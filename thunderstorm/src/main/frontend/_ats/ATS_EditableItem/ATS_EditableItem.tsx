import * as React from 'react';
import {State_SmartComponent} from '../../core/SmartComponent';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools';
import {ComponentSync} from '../../core/ComponentSync';
import { ModuleFE_EditableTest } from '../../_entity';


type State = {};

export class ATS_EditableItemTesting
	extends ComponentSync<{}, State> {

	static defaultProps = {};

	static screen: AppToolsScreen = {
		name: 'Editable Item Testing',
		key: 'editable-item-testing',
		modulesToAwait: [ModuleFE_EditableTest],
		renderer: this,
		group: ATS_Frontend
	};

	protected async deriveStateFromProps(nextProps: {}, state: State & State_SmartComponent) {
		return state;
	}

	render() {
		return <div>
		</div>;
	}
}