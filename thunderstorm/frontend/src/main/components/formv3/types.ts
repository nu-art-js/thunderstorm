import {ValidatorTypeResolver} from '@nu-art/ts-common';
import * as React from 'react';


export type ObjectProp<Def extends ObjectPropDef<any, any>> = {
	prop: Def['prop']
	showErrors: boolean
	value?: Def['valueType']
	defaultValue?: Def['valueType']
	validator?: Def['validator']
	onChange: (value: Def['valueType'], id: Def['prop']) => void;
	onAccept: (value: Def['valueType'], id: Def['prop']) => Promise<void>;
};

type ObjectPropDef<EnclosingType, Prop extends keyof EnclosingType, EditingType = EnclosingType[Prop]> = {
	enclosingType: EnclosingType
	prop: Prop
	valueType: EditingType
	validator: ValidatorTypeResolver<EditingType>
	renderer: (value: ObjectProp<ObjectPropDef<EnclosingType, Prop>>) => React.ReactNode
}

export type FormV3<EditingType> = {
	editingType: EditingType,
	validator: ValidatorTypeResolver<EditingType>
	properties: { [K in keyof EditingType]: ObjectPropDef<EditingType, K> }
}

export type FormRendererV2< Form extends FormV3<any>, > = { [K in keyof Form["editingType"]]: (value: ObjectProp<Form["properties"][K]>) => React.ReactNode }
