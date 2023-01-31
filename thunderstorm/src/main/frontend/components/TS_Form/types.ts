import * as React from 'react';
import {ValidatorTypeResolver} from '@nu-art/ts-common';

export type TS_Form_RendererProps<V, T extends object = any> = {
	onChange: (value?: V) => void;
	validator?: ValidatorTypeResolver<V>;

	//Optionals
	value?: V;
	defaultValue?: V;
	label?: string;
}

export type TS_Form_ItemRenderer<V, T extends object = any> = React.ElementType<TS_Form_RendererProps<V, T>>

export type TS_Form_Element<V, T extends object = any> = TS_Form_RendererProps<V, T> & {
	renderer: TS_Form_ItemRenderer<V, T> | ((props: TS_Form_RendererProps<V, T>, context: T) => TS_Form_ItemRenderer<V, T>)
}