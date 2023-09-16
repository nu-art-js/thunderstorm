import {FormV2, FormRendererV2, ObjectProp} from './types';
import * as React from 'react';
import {Component_FormV2} from './FormV2';
import {EditableRef} from '../Item_Editor';
import {tsValidateBoolean, tsValidateNumber, tsValidateString} from '@nu-art/ts-common';


type TestType = {
	stringProp: string
	numericProp: number
	binaryProp: boolean
	// nestedObject: {
	// 	nestedStringProp: string
	// 	nestedNumericProp: number
	// 	nestedBinaryProp: boolean
	// }
	// innerStringArray: string[]
	// innerNumberArray: string[]
	// innerBooleanArray: string[]
	// innerObjectArray: {
	// 	inArrayStringProp: string
	// 	inArrayNumericProp: number
	// 	inArrayBinaryProp: boolean
	// }[]
}

type TestForm = FormV2<TestType>;

type TestFormRenderer = FormRendererV2<TestForm>;

const TestFormRenderer: Partial<TestFormRenderer> = {
	stringProp: () => <>Here be string editor</>
};

export const TestFormComponent = (p: EditableRef<TestType>) => {
	const validator = {
		stringProp: tsValidateString(),
		numericProp: tsValidateNumber(),
		binaryProp: tsValidateBoolean(),
	};
	return <Component_FormV2<TestForm>
		renderer={TestFormRenderer}
		validator={validator}
		onAccept={p.editable.save}
		editable={p.editable}
	/>;
};