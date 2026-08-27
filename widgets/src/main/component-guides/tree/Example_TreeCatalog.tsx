import * as React from 'react';
import {useMemo, useState} from 'react';
import {TS_Tree} from '../../adapter/tree/v3/TS_Tree.js';
import {TS_Tree as TS_TreeClass} from '../../adapter/tree/v1/TS_Tree.js';
import {createCatalogTreeData} from './catalog-tree.data.js';
import {buildCatalogTreeAdapter, catalogSelectionRendererMap} from './catalog-tree.maps.js';
import {CatalogTree} from './catalog-tree.types.js';
import './Example_TreeCatalog.scss';

const renderCatalogDetail = (selected: CatalogTree['nodeType']) => {
	type Renderer = React.ComponentType<CatalogTree['map'][typeof selected.type]>;
	const Renderer = catalogSelectionRendererMap[selected.type] as Renderer | undefined;
	if (!Renderer)
		return <div className={'ts-tree-example__detail-hint'}>No detail panel for this node type.</div>;
	return <Renderer {...selected.item}/>;
};

/** Sample B — typed catalog tree + multiRender + master–detail selection. */
export const Example_TreeCatalog: React.FC = () => {
	const [selectedPath, setSelectedPath] = useState('/');
	const data = useMemo(createCatalogTreeData, []);
	const adapter = useMemo(() => buildCatalogTreeAdapter(data), [data]);
	const selected = TS_TreeClass.resolveItemFromPath(data, selectedPath)
		?? TS_TreeClass.resolveItemFromPath(data, '/');

	return (
		<div className={'ts-tree-example ts-tree-example--catalog'}>
			<div className={'ts-tree-example__tree-panel'}>
				<TS_Tree
					id={'ts-tree-example-catalog'}
					adapter={adapter}
					selectedPath={selectedPath}
					onNodeClicked={(path, item: CatalogTree['nodeType']) => {
						if (catalogSelectionRendererMap[item.type])
							setSelectedPath(path);
					}}
					checkExpanded={(expanded, path) => expanded[path] ?? path.split('/').length <= 3}
				/>
			</div>
			<div className={'ts-tree-example__detail-panel'}>
				{selected && renderCatalogDetail(selected)}
			</div>
		</div>
	);
};
