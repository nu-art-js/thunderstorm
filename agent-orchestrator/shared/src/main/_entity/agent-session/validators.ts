/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateArray, tsValidateNumber, tsValidateOptional, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import type {DatabaseDef_AgentSession} from './types.js';

export const AgentSession_modifiablePropsValidator: DatabaseDef_AgentSession['modifiablePropsValidator'] = {
	userId: tsValidateString(),
	clientId: tsValidateString(),
	scopes: tsValidateArray(tsValidateString()),
	mcpServerName: tsValidateString(),
	mcpSessionId: tsValidateString(-1, false),
	status: tsValidateValue(['active', 'idle', 'terminated'] as const),
	lastActivityAt: tsValidateNumber(),
	metadata: tsValidateOptional,
};

export const AgentSession_generatedPropsValidator: DatabaseDef_AgentSession['generatedPropsValidator'] = {};
