import {ComponentSync} from '../../core/ComponentSync.js';
import {TS_JSONViewer_Tree, TS_JSONViewer_Tree_Item} from './types.js';
import {_keys, sortArray} from '@nu-art/ts-common';
import {TS_Tree} from '../TS_Tree/index.js';
import {AdapterBuilder} from '../adapter/Adapter.js';
import {NodeRendererProps} from '../adapter/BaseRenderer.js';
import {_className} from '../../utils/tools.js';
import {LL_H_C} from '../Layouts/index.js';
import './TS_JSONViewer.scss';
import {TS_Icons} from '@nu-art/ts-styles';

type Props = {
	item: Object;
	filterGeneratedFields?: boolean;
};

type State = {
	item: Object;
};

export class TS_JSONViewer
	extends ComponentSync<Props, State> {

	private multiRenderer: TS_JSONViewer_Tree['nodeRenderer'] = {
		root: () => <></>,
		item: (props) => this.renderTreeItem(props)
	};

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.item = nextProps.item;
		if (nextProps.filterGeneratedFields)
			_keys(state.item).forEach(key => {
				if (key.startsWith('_'))
					delete state.item[key];
			});

		return state;
	}

	private createTree = (parentNode?: TS_JSONViewer_Tree['nodeType']) => {
		//If parentNode wasn't passed, start the parent node as the root
		parentNode ??= {type: 'root', item: this.state.item,};
		//Set the children for this parentNode
		const item = parentNode.type === 'root' ? parentNode.item : parentNode.item.value;
		const keys = _keys(item);
		if (!Array.isArray(item))
			sortArray(keys);

		parentNode._children = keys.map(childKey => {
			const child = item[childKey];
			const node: TS_JSONViewer_Tree['nodeType'] = {type: 'item', item: {key: childKey as string, value: child}};
			//recursively fill children for object children nodes
			return typeof child === 'object' ? this.createTree(node) : node;
		});

		return parentNode;
	};

	render() {
		const tree = this.createTree();
		const adapter = AdapterBuilder()
			.tree()
			.multiRender(this.multiRenderer)
			.setExpandCollapseRenderer(this.renderTreeExpandIcon)
			.hideRoot()
			.setData(tree)
			.build();

		return <div className={'ts-json-viewer'}>
			<TS_Tree adapter={adapter}/>
		</div>;
	}

	private renderTreeItem = (props: NodeRendererProps<TS_JSONViewer_Tree_Item>) => {
		const {key, value} = props.item;
		const className = _className('ts-json-viewer__item', typeof value);
		const stringedValue = JSON.stringify(value);
		return <LL_H_C className={className}>
			<div className={'ts-json-viewer__item__key'}>{key}:</div>
			{(typeof value !== 'object' || !props.node.expanded) &&
				<div className={'ts-json-viewer__item__value'}>{stringedValue}</div>}
		</LL_H_C>;
	};

	private renderTreeExpandIcon = (props: NodeRendererProps<TS_JSONViewer_Tree['nodeType']>) => {
		if (typeof props.item.item.value !== 'object')
			return <div className={'ts-json-viewer__icon-placeholder'}/>;

		const className = _className('ts-json-viewer__icon', props.node.expanded && 'expanded');
		return <TS_Icons.treeCollapse.component className={className}/>;
	};
}