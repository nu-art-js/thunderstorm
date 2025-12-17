import {SearchAddOn, SearchAddOnDef} from '../../../_core/SearchAddOn.js';

export type AddOnDef_Label = SearchAddOnDef<'label', void, 'getLabel', string>;
export const AddOn_Label: SearchAddOn<AddOnDef_Label> = {
	key: 'label',
	methodName: 'getLabel',
	resultFilter: () => ({pass: true}),
	isActive: () => true,
};