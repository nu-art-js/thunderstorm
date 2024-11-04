import * as React from 'react';
import './ATS_IDBCacheComparison.scss';
import {AppToolsScreen, ATS_Frontend} from '../../components/TS_AppTools';
import {LL_V_L} from '../../components/Layouts';
import {capitalizeFirstLetter, RuntimeModules, sortArray} from '@nu-art/ts-common';
import {ModuleFE_BaseApi} from '../../modules/db-api-gen/ModuleFE_BaseApi';
import {DBModuleType} from '../../../shared';
import {TS_Table} from '../../components/TS_Table';
import {ComponentSync} from '../../core/ComponentSync';
import {TS_ButtonV2} from '../../components/TS_ButtonV2/TS_ButtonV2';
import {_className} from '../../utils/tools';

type State = {
	collectionDetails: {
		dbKey: string
		idbCount: number
		cacheCount: number
	}[]
}
type Props = {}

const tableHeaders = [{header: 'DbKey'}, {header: 'IDB', widthPx: 200}, {header: 'Cache', widthPx: 200}];

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

	private loadCollectionDetails = async () => {
		const collectionModules = sortArray(ATS_IDBCacheComparison.getCollectionModules(), item => item.dbDef.dbKey);
		const collectionDetails = await Promise.all(collectionModules.map(async module =>
			({
				dbKey: module.dbDef.dbKey,
				idbCount: await module.IDB.count(),
				cacheCount: module.cache._array.length
			}))
		);
		this.reDeriveState({collectionDetails});
	};

	private renderComparisonGrid = () => {
		if (!this.state.collectionDetails)
			return;

		return <TS_Table header={tableHeaders}
																														  rows={this.state.collectionDetails}
																														  headerRenderer={header => <div>{capitalizeFirstLetter(header)}</div>}
																														  cellRenderer={(header, item, index) => {
							 const rowDetails = this.state.collectionDetails[index];
							 const issue = rowDetails.cacheCount != rowDetails.idbCount;
							 switch (header) {
								 case 'IDB':
									 return <div className={_className('cell-idb', issue && 'issue')}>{item.idbCount}</div>;
								 case 'Cache':
									 return <div className={_className('cell-cache', issue && 'issue')}>{item.cacheCount}</div>;
								 case 'DbKey':
									 return <div className={_className('cell-dbkey', issue && 'issue')}>{item.dbKey}</div>;
								 default:
									 return 'Bad Header';
							 }
						 }}/>;
	};

	render() {
		return <LL_V_L className={'ats-full-page'}>
			<LL_V_L>
				<TS_ButtonV2 onClick={this.loadCollectionDetails}>Load Data</TS_ButtonV2>
			</LL_V_L>
		<LL_V_L className={'page-body'}>
			{this.renderComparisonGrid()}
		</LL_V_L>
		</LL_V_L>;
	}
}