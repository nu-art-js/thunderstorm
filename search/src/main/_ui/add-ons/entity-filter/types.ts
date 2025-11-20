import {SearchAddOn, SearchAddOnDef} from '../../../_core/index.js';

export type AddOnDef_EntityFilter = SearchAddOnDef<'entity', string[] | undefined, 'getEntityKey', string>;
export const AddOn_EntityFilter: SearchAddOn<AddOnDef_EntityFilter> = {
	key: 'entity',
	methodName: 'getEntityKey',
	resultFilter: (entities, result) => {
		return {pass: entities.includes(result.filterResults['entity'].value)};
	},
	isActive: (entities) => !!entities?.length,
};