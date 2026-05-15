/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {DatabaseDef_WorkflowTask, WorkflowTask_DbKey} from './types.js';
import {WorkflowTask_generatedPropsValidator, WorkflowTask_modifiablePropsValidator} from './validators.js';

export const DBDef_WorkflowTask: Database<DatabaseDef_WorkflowTask> = {
	dbKey: WorkflowTask_DbKey,
	entityName: 'WorkflowTask',
	modifiablePropsValidator: WorkflowTask_modifiablePropsValidator,
	generatedPropsValidator: WorkflowTask_generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {group: 'agent-orchestrator', name: 'workflow-task'},
	backend: {name: WorkflowTask_DbKey},
};
