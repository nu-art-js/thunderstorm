import {CatalogTree} from './catalog-tree.types.js';

/** Static demo data — rebuild when wiring a real feature from live state instead. */
export const createCatalogTreeData = (): CatalogTree['nodeType'] => ({
	type: 'catalog',
	item: {title: 'Design Language', version: '1.0'},
	_children: [
		{
			type: 'group',
			item: {label: 'Components', description: 'Tokenized Thunderstorm widgets', childCount: 3},
			_children: [
				{type: 'entry', item: {id: 'button', name: 'Button', status: 'active'}},
				{type: 'entry', item: {id: 'input', name: 'Input', status: 'active'}},
				{type: 'entry', item: {id: 'tree', name: 'Tree', status: 'draft'}},
			],
		},
		{
			type: 'group',
			item: {label: 'Tokens', description: 'Global design tokens', childCount: 2},
			_children: [
				{type: 'entry', item: {id: 'colors', name: 'Colors', status: 'active'}},
				{type: 'entry', item: {id: 'typography', name: 'Typography', status: 'active'}},
			],
		},
		{
			type: 'settings',
			item: {theme: 'dark', density: 'comfortable'},
		},
	],
});
