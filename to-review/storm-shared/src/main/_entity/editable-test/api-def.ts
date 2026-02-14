/*
 * @nu-art/storm-shared - Shared types for storm packages
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {HttpMethod, BodyApi, ApiDefResolver} from '@nu-art/api-types';

export type ApiStruct_EditableTest = {
	_v1: BodyApi<void, void>;
};

export const ApiDef_EditableTest: ApiDefResolver<ApiStruct_EditableTest> = {
	_v1: { method: HttpMethod.POST, path: 'v1/editable-test' },
};
