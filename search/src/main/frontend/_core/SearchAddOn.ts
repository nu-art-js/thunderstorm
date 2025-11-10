import {ReactElement} from 'react';

export type SearchAddOnDef<
	Key extends string, //The addon key
	Param extends any, //The type of the param held in the filter dictionary
	MethodName extends string, //The name of the method that the search item needs to implement
	ItemParam extends any //The type of the param given by the item to compare against
> = {
	key: Key;
	param: Param;
	methodName: MethodName;
	itemParam: ItemParam;
}

export type SearchAddOn<Def extends SearchAddOnDef<any, any, any, any>> = {
	renderer: (onChangeCallback: (key: Def['key'], param: Def['param']) => void) => ReactElement;
}