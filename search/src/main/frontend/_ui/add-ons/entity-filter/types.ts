import {SearchAddOn, SearchAddOnDef} from '../../../_core';

export type AddOnDef_EntityFilter = SearchAddOnDef<'entity', string[] | undefined, 'getEntityKey', string>;
export const AddOn_EntityFilter: SearchAddOn<AddOnDef_EntityFilter> = {
	key: 'entity',
	methodName: 'getEntityKey',
	valueFilter: (entities, entityKey) => entities.includes(entityKey),
	isActive: (entities) => !!entities?.length,
};