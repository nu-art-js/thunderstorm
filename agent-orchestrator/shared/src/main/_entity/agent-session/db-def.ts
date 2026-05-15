/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Database} from '@nu-art/db-api-shared';
import {AgentSession_DbKey, DatabaseDef_AgentSession} from './types.js';
import {AgentSession_generatedPropsValidator, AgentSession_modifiablePropsValidator} from './validators.js';

export const DBDef_AgentSession: Database<DatabaseDef_AgentSession> = {
	dbKey: AgentSession_DbKey,
	entityName: 'AgentSession',
	modifiablePropsValidator: AgentSession_modifiablePropsValidator,
	generatedPropsValidator: AgentSession_generatedPropsValidator,
	versions: ['1.0.0'],
	uniqueKeys: ['_id'],
	frontend: {group: 'agent-orchestrator', name: 'agent-session'},
	backend: {name: AgentSession_DbKey},
};
