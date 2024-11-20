import {compare, filterInstances, sortArray, TypedMap} from '@nu-art/ts-common';
import {ComponentSync} from '../../core/ComponentSync';
import {ModuleFE_BaseDB} from '../../modules/db-api-gen/ModuleFE_BaseDB';
import * as React from 'react';
import {Grid} from '../../components/Layouts';
import './Component_CollectionGrid.scss';
import {_className} from '../../utils/tools';

type Props = {
	modules: ModuleFE_BaseDB<any>[];
};

type State = {
	modules: ModuleFE_BaseDB<any>[];
	idbCountMap: TypedMap<number>;
	cacheCountMap: TypedMap<number>;
};

export class Component_CollectionGrid
	extends ComponentSync<Props, State> {

	// ######################## Life Cycle ########################

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.modules = nextProps.modules;
		state.cacheCountMap ??= {};
		state.idbCountMap ??= {};
		return state;
	}

	componentDidMount() {
		this.refreshCountMaps();
	}

	componentDidUpdate(prevProps: Readonly<Props>, prevState: Readonly<State>) {
		const prevModuleKeys = prevState.modules.map(module => module.dbDef.dbKey);
		const currentModuleKeys = this.state.modules.map(module => module.dbDef.dbKey);
		if (!compare(prevModuleKeys, currentModuleKeys))
			this.refreshCountMaps();
	}

	// ######################## Logic ########################

	private refreshCountMaps = async () => {
		const idbCountMap: TypedMap<number> = {};
		const cacheCountMap: TypedMap<number> = {};
		for (const module of this.props.modules) {
			idbCountMap[module.dbDef.dbKey] = await module.IDB.count();
			cacheCountMap[module.dbDef.dbKey] = module.cache._array.length;
		}
		this.setState({idbCountMap, cacheCountMap});
	};

	private getSortedDBKeys = () => {
		const keys = filterInstances(this.state.modules.map(module => {
			const dbKey = module.dbDef?.dbKey;
			if (!dbKey) {
				this.logWarning(`Skipping ${module.getName()}, because it has no dbKey`);
				return;
			}
			return dbKey;
		}));
		//Sort alphabetically
		sortArray(keys);

		//Bring mismatch items to the top
		return sortArray(keys, key => {
			const idbCount = this.state.idbCountMap[key];
			const cacheCount = this.state.cacheCountMap[key];
			return idbCount !== cacheCount ? 0 : 1;
		});
	};

	// ######################## Render ########################

	render() {
		const dbKeys = this.getSortedDBKeys();
		return <Grid className={'collections-grid'}>
			{this.renderHeaders()}
			{dbKeys.map(this.renderDataForKey)}
		</Grid>;
	}

	private renderHeaders = () => {
		return <Grid className={'collections-grid__row header'}>
			<div className={'collections-grid__header'}>DB Key</div>
			<div className={'collections-grid__header'}>IDB Count</div>
			<div className={'collections-grid__header'}>Cache Count</div>
		</Grid>;
	};

	private renderDataForKey = (dbKey: string) => {
		const idbCount = this.state.idbCountMap[dbKey];
		const cacheCount = this.state.cacheCountMap[dbKey];
		const className = _className('collections-grid__row', idbCount !== cacheCount && 'count-mismatch');
		return <Grid className={className} key={dbKey}>
			<div className={'collections-grid__value'}>{dbKey}</div>
			<div className={'collections-grid__value'}>{idbCount ?? 'N/A'}</div>
			<div className={'collections-grid__value'}>{cacheCount ?? 'N/A'}</div>
		</Grid>;
	};
}