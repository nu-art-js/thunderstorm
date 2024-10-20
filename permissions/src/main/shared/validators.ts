/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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

import {tsValidateRegexp, tsValidateUniqueId} from '@nu-art/ts-common';


export const validateProjectId = tsValidateUniqueId;
export const tsValidateStringWithDashesAndSlash = tsValidateRegexp(/^[0-9A-Za-z-/]+$/);
export const validateProjectName = tsValidateRegexp(/^[A-Za-z- ]{3,40}$/);
export const validateUserUuid = tsValidateRegexp(/^.{0,50}$/);
export const validateGroupLabel = tsValidateRegexp(/^[A-Za-z-0-9\._\/ ]+$/);
export const validateCustomFieldValues = tsValidateRegexp(/^.{0,500}$/);
