import {AdapterBuilder} from '../../adapter/Adapter.js';
import {TreeExpandCollapseChevron, wrapTreeNodeWithCaret} from '../../adapter/tree/TreeCaret.js';
import {CatalogTree} from './catalog-tree.types.js';

const statusLabel = (status: 'active' | 'draft') =>
	status === 'active' ? 'active' : 'draft';

/** Per-type tree row labels — keys must match node `type` values. */
export const catalogTreeRendererMap: CatalogTree['nodeRenderer'] = {
	catalog: props => (
		<span className={'ts-tree-example__row ts-tree-example__row--catalog'}>
			<span className={'ts-tree-example__row-icon'} aria-hidden>{'📁'}</span>
			{props.item.title}
		</span>
	),
	group: props => (
		<span className={'ts-tree-example__row ts-tree-example__row--group'}>
			{`${props.item.label} (${props.item.childCount})`}
		</span>
	),
	entry: props => (
		<span className={'ts-tree-example__row ts-tree-example__row--entry'}>
			<span className={'ts-tree-example__row-icon'} aria-hidden>{'•'}</span>
			{props.item.name}
			<span className={`ts-tree-example__status ts-tree-example__status--${props.item.status}`}>
				{statusLabel(props.item.status)}
			</span>
		</span>
	),
	settings: () => (
		<span className={'ts-tree-example__row ts-tree-example__row--settings'}>
			<span className={'ts-tree-example__row-icon'} aria-hidden>{'⚙'}</span>
			Settings
		</span>
	),
};

/** Detail panel renderers — only types listed here are selectable in master–detail flows. */
export const catalogSelectionRendererMap: CatalogTree['rendererV3'] = {
	catalog: props => (
		<div className={'ts-tree-example__detail'}>
			<div className={'ts-tree-example__detail-title'}>{props.title}</div>
			<div className={'ts-tree-example__detail-meta'}>{`Version ${props.version}`}</div>
		</div>
	),
	group: props => (
		<div className={'ts-tree-example__detail'}>
			<div className={'ts-tree-example__detail-title'}>{props.label}</div>
			{props.description && (
				<div className={'ts-tree-example__detail-meta'}>{props.description}</div>
			)}
		</div>
	),
	entry: props => (
		<div className={'ts-tree-example__detail'}>
			<div className={'ts-tree-example__detail-title'}>{props.name}</div>
			<div className={'ts-tree-example__detail-meta'}>{`Id: ${props.id}`}</div>
			<div className={'ts-tree-example__detail-meta'}>{`Status: ${props.status}`}</div>
		</div>
	),
	settings: props => (
		<div className={'ts-tree-example__detail'}>
			<div className={'ts-tree-example__detail-title'}>Settings</div>
			<div className={'ts-tree-example__detail-meta'}>{`Theme: ${props.theme}`}</div>
			<div className={'ts-tree-example__detail-meta'}>{`Density: ${props.density}`}</div>
		</div>
	),
};

export const buildCatalogTreeAdapter = (data: CatalogTree['nodeType']) =>
	AdapterBuilder()
		.tree()
		.multiRender(catalogTreeRendererMap)
		.setExpandCollapseRenderer(TreeExpandCollapseChevron)
		.setNodeRenderer(wrapTreeNodeWithCaret(props => {
			const type = props.item.type as keyof CatalogTree['map'];
			const Row = catalogTreeRendererMap[type];
			return <Row item={props.item.item} node={props.node}/>;
		}))
		.setData(data)
		.build();
