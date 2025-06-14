import {DBEntityDependencies} from '@nu-art/thunderstorm';
import {Adapter, AdapterBuilder, ComponentSync, TS_Tree} from '@nu-art/thunderstorm/frontend';
import {calculateConflictResolutionTree} from './tree-calculation';
import {ConflictResolutionTreeRenderers} from './tree-rendering';
import {ModuleFE_ConflictResolution} from '../../_modules/ModuleFE_ConflictResolution';
import './ConflictResolutionTree.scss';

type Props = {
	dependencies: DBEntityDependencies;
};

type State = {
	treeAdapter: Adapter;
};

export class ConflictResolutionTree
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.treeAdapter = this.createAdapter(nextProps.dependencies);
		return state;
	}

	private createAdapter(dependencies: DBEntityDependencies) {
		const tree = calculateConflictResolutionTree(dependencies);
		const conflictResolutionItemMap = ModuleFE_ConflictResolution.getConflictResolutionItemMap();
		return AdapterBuilder()
			.tree()
			.multiRender(ConflictResolutionTreeRenderers(conflictResolutionItemMap))
			.setData(tree)
			.hideRoot()
			.build();
	}

	render() {
		return <TS_Tree adapter={this.state.treeAdapter} className={'conflict-resolution-tree'}/>;
	}
}