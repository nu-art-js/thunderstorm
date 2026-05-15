/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DB_Object, DB_ProtoSeed, DB_Prototype, VersionsDeclaration} from '@nu-art/db-api-shared';

export const AgentSession_DbKey = 'agent--sessions';
type DBKey = typeof AgentSession_DbKey;
type VersionTypes = { '1.0.0': DB_AgentSession };
type Versions = VersionsDeclaration<['1.0.0'], VersionTypes>;
type UniqueKeys = '_id';
type GeneratedProps = never;
type Dependencies = {};

export type DB_AgentSession = DB_Object<DBKey> & {
	userId: string;
	clientId: string;
	scopes: string[];
	mcpServerName: string;
	mcpSessionId?: string;
	status: 'active' | 'idle' | 'terminated';
	lastActivityAt: number;
	metadata?: Record<string, unknown>;
};

export type DatabaseDef_AgentSession = DB_Prototype<DB_ProtoSeed<DB_AgentSession, DBKey, GeneratedProps, Versions, UniqueKeys, Dependencies>>;
export type UI_AgentSession = DatabaseDef_AgentSession['uiType'];
