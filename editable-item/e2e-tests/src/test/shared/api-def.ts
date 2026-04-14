/*
 * @nu-art/editable-item-e2e-tests - Shared test entity api-def
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {ApiDefResolver} from '@nu-art/api-types';

export type RequestType = Record<string, never>;
export type ResponseType = Record<string, never>;

export type API_EditableTest = Record<string, never>;

export const ApiDef_EditableTest: ApiDefResolver<API_EditableTest> = {};
