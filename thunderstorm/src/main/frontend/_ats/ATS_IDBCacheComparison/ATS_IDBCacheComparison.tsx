import './ATS_IDBCacheComparison.scss';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools/index.js';
import {RuntimeModules} from '@nu-art/ts-common';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi.js';
import {DBModuleType} from '../../../shared/index.js';
import {ComponentSync} from '../../core/ComponentSync.js';
import {Component_CollectionGrid} from './Component_CollectionGrid.js';

type State = {
	collectionDetails: {
		dbKey: string
		idbCount: number
		cacheCount: number
	}[]
}
type Props = {}

export class ATS_IDBCacheComparison
	extends ComponentSync<Props, State> {

	static screen: AppToolsScreen = {
		name: 'IDB<>CACHE View',
		key: 'idb<>cache',
		renderer: this,
		group: ATS_Frontend,
		modulesToAwait: () => this.getCollectionModules()
	};

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: {}, state?: State): State {
		state ??= this.state ? {...this.state} : {} as State;
		return state;
	}

	private static getCollectionModules() {
		const modules = RuntimeModules().filter<ModuleFE_BaseApi<any>>((module: DBModuleType) => !!module.dbDef?.dbKey)
			.filter(module => module.dbDef.dbKey !== 'data-input-logs');
		return modules;
	}

	render() {
		return <div className={'ats__idb-cache'}>
			<Component_CollectionGrid modules={ATS_IDBCacheComparison.getCollectionModules()}/>
		</div>;
	}
}