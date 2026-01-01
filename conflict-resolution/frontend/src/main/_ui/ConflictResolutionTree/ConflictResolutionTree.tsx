import { DBEntityDependencies } from '@nu-art/thunder-db-api-shared';
import { Adapter, AdapterBuilder, ComponentSync, TS_Tree } from "@nu-art/thunder-routing";
import { calculateConflictResolutionTree } from './tree-calculation.js';
import { ConflictResolutionTreeRenderers } from './tree-rendering.js';
import { ModuleFE_ConflictResolution } from '../../_modules/ModuleFE_ConflictResolution.js';
import './ConflictResolutionTree.scss';
type Props = {
    dependencies: DBEntityDependencies;
};
type State = {
    treeAdapter: Adapter;
};
export class ConflictResolutionTree extends ComponentSync<Props, State> {
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
