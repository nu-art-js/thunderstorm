import {SearchAddOn, SearchAddOnDef} from '../../../_core';

export type AddOnDef_EntityFilter = SearchAddOnDef<'entity', string[] | undefined, 'getEntityKey', string>;
export const AddOn_EntityFilter: SearchAddOn<AddOnDef_EntityFilter> = {
	key: 'entity',
	methodName: 'getEntityKey',
	valueFilter: (entities, result) => entities.includes(result.filterResults['entity']),
	isActive: (entities) => !!entities?.length,
};