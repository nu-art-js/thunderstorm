import {DBEntityDependencies} from '@nu-art/thunderstorm-frontend';
import {Button, ComponentSync, LL_H_C, LL_V_L, ModuleFE_BaseDB} from '@nu-art/thunderstorm/frontend/index';
import {_keys, _values, filterDuplicates, flatArray, RuntimeModules} from '@nu-art/ts-common';
import {dispatch_ShowConflictResolution} from '../../_dispatchers/index.js';
import {TS_Icons} from '@nu-art/ts-styles/icons/index';
import './Panel_ConflictResolution.scss';
import {ConflictResolutionTree} from '../ConflictResolutionTree/ConflictResolutionTree.js';

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
		return <div className={'panel__conflict-resolution__tree-wrapper'}>
			<ConflictResolutionTree dependencies={this.state.dependencies}/>
		</div>
	};
}