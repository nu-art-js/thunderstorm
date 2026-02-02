/*
 * Database API infrastructure library for Thunderstorm.
 *
 * Shared CRUD type definitions for FE and BE modules (no Proto).
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import type {DB_Object, ValidatorTypeResolver} from '@nu-art/ts-common';

/**
 * Minimal type definition for CRUD modules (frontend and backend).
 * DBItem extends ts-common DB_Object so FE/BE work with dbObjectToId, Response_DBSync, etc.
 */

