/*
 * @nu-art/agent-orchestrator-shared - Agent orchestrator shared types
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type HumanGateRequest = {
	taskId: string;
	prompt: string;
	channel?: string;
	options?: string[];
	metadata?: Record<string, unknown>;
};

export type HumanGateResponse = {
	gateId: string;
	taskId: string;
	respondedBy?: string;
	response: string;
	respondedAt: number;
};

export interface HumanGateProvider {
	postQuestion(request: HumanGateRequest): Promise<string>;
}
