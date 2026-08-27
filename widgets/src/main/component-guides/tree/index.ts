import {WidgetComponentGuide} from '../types.js';
import {Example_TreeCatalog} from './Example_TreeCatalog.js';
import {Example_TreeObject} from './Example_TreeObject.js';

export * from './catalog-tree.types.js';
export * from './catalog-tree.data.js';
export * from './catalog-tree.maps.js';
export * from './Example_TreeObject.js';
export * from './Example_TreeCatalog.js';

export const treeComponentGuide: WidgetComponentGuide = {
	id: 'tree',
	title: 'Tree',
	howToPath: 'component-guides/tree/how-to.md',
	examples: {
		object: Example_TreeObject,
		catalog: Example_TreeCatalog,
	},
	primaryExample: Example_TreeCatalog,
};
