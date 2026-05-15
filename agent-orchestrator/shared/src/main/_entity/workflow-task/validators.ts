/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {tsValidateNumber, tsValidateOptional, tsValidateString, tsValidateValue} from '@nu-art/ts-common';
import {_workflowStatuses, DatabaseDef_WorkflowTask} from './types.js';

export const WorkflowTask_modifiablePropsValidator: DatabaseDef_WorkflowTask['modifiablePropsValidator'] = {
	agentSessionId: tsValidateString(),
	toolName: tsValidateString(),
	status: tsValidateValue(_workflowStatuses),
	input: tsValidateOptional,
	result: tsValidateOptional,
	error: tsValidateString(-1, false),
	gateId: tsValidateString(-1, false),
	webhookId: tsValidateString(-1, false),
	ttlMs: tsValidateNumber(),
};

export const WorkflowTask_generatedPropsValidator: DatabaseDef_WorkflowTask['generatedPropsValidator'] = {};
