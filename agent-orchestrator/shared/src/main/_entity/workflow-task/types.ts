/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const WorkflowTask_DbKey = 'agent--workflow-tasks';
type DBKey = typeof WorkflowTask_DbKey;
type VersionTypes = { '1.0.0': DB_WorkflowTask };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};

export const _workflowStatuses = ['pending', 'running', 'waiting_human', 'completed', 'failed', 'cancelled'] as const;
export type WorkflowStatus = typeof _workflowStatuses[number];

export type DB_WorkflowTask = DB_Object<DBKey> & {
	agentSessionId: string;
	toolName: string;
	status: WorkflowStatus;
	input?: Record<string, unknown>;
	result?: Record<string, unknown>;
	error?: string;
	gateId?: string;
	webhookId?: string;
	ttlMs: number;
};

export type DatabaseDef_WorkflowTask = DB_Prototype<DB_ProtoSeed<DB_WorkflowTask, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_WorkflowTask = DatabaseDef_WorkflowTask['uiType'];
