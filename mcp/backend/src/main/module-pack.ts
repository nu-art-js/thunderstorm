/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_McpServer} from './ModuleBE_McpServer.js';

export const ModulePackBE_Mcp: Module[] = [
	ModuleBE_McpServer,
];
