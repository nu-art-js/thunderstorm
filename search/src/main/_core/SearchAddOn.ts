import {DBPointer} from '@nu-art/ts-common';

export type SearchResult = DBPointer & { filterResults: { [k: string]: { value: any, score?: number } } }

export type SearchAddOnDef<
	Key extends string, //The addon key
	ValueType extends any, //The type of the value held in the filter dictionary
	MethodName extends string, //The name of the method that the search item needs to implement
	ItemValueType extends any //The type of the value given by the item to compare against
> = {
	key: Key;
	valueType: ValueType;
	methodName: MethodName;
	itemValueType: ItemValueType;
}

export type SearchAddOn<Def extends SearchAddOnDef<any, any, any, any>> = {
	key: Def['key'];
	methodName: Def['methodName'];
	resultFilter: (value: NonNullable<Def['valueType']>, item: SearchResult) => { pass: boolean, score?: number };
	valueTransform?: (value: NonNullable<Def['valueType']>) => NonNullable<Def['valueType']>;
	isActive: (param: Def['valueType']) => boolean;
}