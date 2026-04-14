/*
 * Thunderstorm form package.
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import * as React from 'react';
import {TS_Object, ValidatorTypeResolver} from '@nu-art/ts-common';

export type InputField<T, K extends keyof T = keyof T> = {
	type: 'text' | 'number' | 'password';
	label: string;
	className?: string;
	hint?: string;
};

export type Form<T extends TS_Object> = { [K in keyof T]: InputField<T, K> };
export type FormRenderer<T extends TS_Object> = { [K in keyof T]: (value: Form_FieldProps<T, K>) => React.ReactNode };

export type Form_FieldProps<T extends TS_Object = TS_Object, K extends keyof T = keyof T> = {
	key: K;
	showErrors: boolean;
	field: InputField<T, K>;
	value?: T[K];
	validator?: ValidatorTypeResolver<T[K]>;
	onChange: (value: any, id: K) => void;
	onAccept: () => void;
};
