import {TreeType} from '../../adapter/Adapter.js';

/** Generic catalog-shaped tree — domain-neutral reference for typed multi-render trees. */
export type CatalogTree = TreeType<{
	catalog: {title: string; version: string};
	group: {label: string; description?: string; childCount: number};
	entry: {id: string; name: string; status: 'active' | 'draft'};
	settings: {theme: string; density: 'compact' | 'comfortable'};
}>;
