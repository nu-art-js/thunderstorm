/*
 * @nu-art/app-config-backend - App config backend module pack
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Module} from '@nu-art/ts-common';
import {ModuleBE_AppConfigDB} from './ModuleBE_AppConfigDB.js';
import {ModuleBE_AppConfigAPI} from './ModuleBE_AppConfigAPI.js';

export const ModulePackBE_AppConfig = [ModuleBE_AppConfigDB, ModuleBE_AppConfigAPI] as Module[];
