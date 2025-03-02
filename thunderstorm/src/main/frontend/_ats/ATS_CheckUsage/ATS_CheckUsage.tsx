import * as React from 'react';
import {filterDuplicates, Minute, RuntimeModules, sortArray} from '@nu-art/ts-common';
import './ATS_CheckUsage.scss';
import {AppToolsScreen, ATS_Backend} from '../../components/TS_AppTools';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {ComponentSync} from '../../core/ComponentSync';
import {Button} from '../../components/Button/Button';
import {ModuleFE_CollectionActions} from '../../modules/ModuleFE_CollectionActions';
import {TS_PropRenderer} from '../../components/TS_PropRenderer';
import {TS_Input} from '../../components/TS_Input';
import {SimpleListAdapter} from '../../components/adapter/Adapter';
import {TS_DropDown} from '../../components/TS_Dropdown';
import { LL_V_L } from '../../components/Layouts';


type State = {
	upgradableModules: ModuleFE_BaseApi<any, any>[];
	selectedModule?: ModuleFE_BaseApi<any>;
	itemId?: string
};

export class ATS_CheckUsage
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Check Usage',
		key: 'check-usage',
		renderer: this,
		group: ATS_Backend,
	};

	protected deriveStateFromProps(nextProps: {}, state: State) {
		state.upgradableModules ??= sortArray(filterDuplicates(RuntimeModules().filter((module: ModuleFE_BaseApi<any>) => {
			return !!module.getCollectionName;
		}), (module: ModuleFE_BaseApi<any>) => module.getCollectionName()), item => item.getCollectionName());

		return state;
	}

	private getAdapter = () => {
		return SimpleListAdapter(this.state.upgradableModules, module => <>{module.item.dbDef.dbKey}</>);
	};

	private checkUsage = async () => {
		const itemId = this.state.itemId;
		const dbKey = this.state.selectedModule?.dbDef.dbKey;
		if (!itemId || !dbKey)
			return;

		const response = await ModuleFE_CollectionActions.check.usage({
			dbKey: dbKey,
			itemIds: [itemId]
		}).setTimeout(2 * Minute).executeSync();
		this.logWarning(response);
	};

	render() {
		const adapter = this.getAdapter();
		return <LL_V_L id={'page__check-usage'}>
			<TS_PropRenderer.Vertical label={'Collection'}>
				<TS_DropDown<ModuleFE_BaseApi<any>>
					adapter={adapter} selected={this.state.selectedModule}
					onSelected={module => this.setState({selectedModule: module})}
				/>
			</TS_PropRenderer.Vertical>
			<TS_PropRenderer.Vertical label={'Item ID'}>
				<TS_Input type={'text'} value={this.state.itemId} onChange={val => this.setState({itemId: val})}/>
			</TS_PropRenderer.Vertical>
			<Button key={'upgrade-all-test'} onClick={this.checkUsage}>Check Usage</Button>
		</LL_V_L>;
	}
}