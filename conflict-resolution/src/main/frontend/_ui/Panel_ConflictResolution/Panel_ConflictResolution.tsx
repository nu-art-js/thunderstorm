import * as React from 'react';
import {DBEntityDependencies, DBEntityDependencyResult} from '@nu-art/thunderstorm';
import {Button, ComponentSync, LL_H_C, LL_V_L, ModuleFE_BaseDB, TS_CollapsableContainer} from '@nu-art/thunderstorm/frontend';
import {RuntimeModules, UniqueId, _keys, _values, filterDuplicates, flatArray} from '@nu-art/ts-common';
import {dispatch_ShowConflictResolution} from '../../_dispatchers';
import {TS_Icons} from '@nu-art/ts-styles/icons';
import './Panel_ConflictResolution.scss';

type Props = {
	dependencies: DBEntityDependencies
};

type State = {
	dependencies: DBEntityDependencies;
	expanded?: boolean;
};

export class Panel_ConflictResolution
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.expanded ??= false;
		state.dependencies = nextProps.dependencies;
		return state;
	}

	// ##################### Logic #####################

	private resolveEntityLabel = () => {
		const module = RuntimeModules().filter(module => (module as ModuleFE_BaseDB<any>).dbDef?.dbKey === this.props.dependencies.dbKey)[0] as ModuleFE_BaseDB<any>;
		return module?.dbDef.entityName ?? 'Entity';
	};

	private closePanel = () => {
		dispatch_ShowConflictResolution.dispatchUI();
	};

	private resolveAmounts = () => {
		const dependencies = this.props.dependencies;
		const dependencyResults = _values(dependencies.dependencyMap);
		const collectionKeys = filterDuplicates(dependencyResults.map(result => _keys(result) as string[]).flat());
		const items = filterDuplicates(flatArray(dependencyResults.map(result => _values(result))));
		return {
			collections: collectionKeys.length,
			items: items.length,
		};
	};

	private expand = () => {
		this.setState({expanded: true});
	};

	// ##################### Render #####################

	render() {
		return <LL_V_L id={'panel__conflict-resolution'} className={this.state.expanded ? 'expanded' : undefined}>
			{this.render_Header()}
			{this.render_Body()}
		</LL_V_L>;
	}

	private render_Header = () => {
		return <LL_H_C className={'panel__conflict-resolution__header'}>
			{this.resolveEntityLabel()} Dependencies
			<TS_Icons.x.component onClick={() => this.closePanel()}/>
		</LL_H_C>;
	};

	private render_Body = () => {
		if (!this.state.expanded)
			return this.render_Body_Closed();

		return this.render_Body_Expanded();
	};

	private render_Body_Closed = () => {
		const amounts = this.resolveAmounts();
		return <LL_V_L className={'panel__conflict-resolution__body-closed'}>
			<p className={'toast__conflict-resolution__body'}>
				{this.resolveEntityLabel()} has {amounts.items} dependencies across {amounts.collections} collections
			</p>
			<Button variant={'primary'} onClick={this.expand}>Show Dependencies</Button>
		</LL_V_L>;
	};

	private render_Body_Expanded = () => {
		const dependencyMap = this.state.dependencies.dependencyMap;
		const entityIds = _keys(dependencyMap);
		return <LL_V_L className={'panel__conflict-resolution__body-expanded'}>
			{entityIds.map(entityId => {
				const results = dependencyMap[entityId];
				return <TS_CollapsableContainer
					key={entityId}
					headerRenderer={<>{entityId}</>}
					containerRenderer={() => this.render_DependencyResult(results)}
				/>;
			})}
		</LL_V_L>;
	};

	private render_DependencyResult = (result: DBEntityDependencyResult) => {
		const dbKeys = _keys(result) as string[];
		return <LL_V_L>
			{dbKeys.map(dbKey => <TS_CollapsableContainer
				key={dbKey}
				headerRenderer={<>{dbKey}</>}
				containerRenderer={() => this.render_DependencyResultItems(dbKey, result[dbKey])}
			/>)}
		</LL_V_L>;
	};

	private render_DependencyResultItems = (dbKey: string, ids: UniqueId[]) => {
		return <LL_V_L>
			{ids.map(id => <div key={id}>{id}</div>)}
		</LL_V_L>;
	};
}