import {filterDuplicates, Minute, RuntimeModules, sortArray} from '@nu-art/ts-common';
import './ATS_ConflictResolution.scss';
import {
	AppToolsScreen,
	ATS_Backend,
	Button,
	ComponentSync,
	LL_V_L,
	ModuleFE_BaseApi,
	SimpleListAdapter,
	TS_DropDown,
	TS_Input,
	TS_PropRenderer
} from '@nu-art/thunderstorm/frontend/index';
import {ModuleFE_CollectionActions} from '@nu-art/thunderstorm/frontend/modules/ModuleFE_CollectionActions';
import {ModuleFE_ConflictResolution} from '../../_modules/ModuleFE_ConflictResolution.js';

type State = {
	upgradableModules: ModuleFE_BaseApi<any, any>[];
	selectedModule?: ModuleFE_BaseApi<any>;
	itemId?: string
};

export class ATS_ConflictResolution
	extends ComponentSync<{}, State> {

	static screen: AppToolsScreen = {
		name: 'Conflict Resolution',
		key: 'conflict-resolution',
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
		if (response.dependencies)
			ModuleFE_ConflictResolution.showDependencies(response.dependencies);
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