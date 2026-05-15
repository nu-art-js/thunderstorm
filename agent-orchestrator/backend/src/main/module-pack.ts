/*
 * @nu-art/agent-orchestrator-backend - Agent orchestrator for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {Module} from '@nu-art/ts-common';
import {ModuleBE_AgentOrchestrator} from './modules/ModuleBE_AgentOrchestrator.js';

export const ModulePackBE_AgentOrchestrator: Module[] = [
	ModuleBE_AgentOrchestrator,
];
