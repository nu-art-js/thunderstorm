/*
 * @nu-art/agent-orchestrator-backend - Agent orchestrator for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Dispatcher, Module} from '@nu-art/ts-common';
import {HttpServer} from '@nu-art/http-server';
import {randomUUID} from 'node:crypto';
import type {DB_AgentSession, DB_WorkflowTask, HumanGateProvider, HumanGateResponse, WorkflowStatus} from '@nu-art/agent-orchestrator-shared';

type Config = {
	webhookBasePath: string;
	sessionTimeoutMs: number;
};

const DefaultConfig: Config = {
	webhookBasePath: '/webhooks/agent',
	sessionTimeoutMs: 3_600_000,
};

const dispatcher_HumanGateProvider = new Dispatcher<HumanGateProvider, 'postQuestion'>('postQuestion');

export class ModuleBE_AgentOrchestrator_Class
	extends Module<Config> {

	private readonly sessions = new Map<string, DB_AgentSession>();
	private readonly tasks = new Map<string, DB_WorkflowTask>();
	private readonly pendingGates = new Map<string, (response: HumanGateResponse) => void>();

	constructor() {
		super();
		this.setDefaultConfig(DefaultConfig);
	}

	protected init(): void {
		this.mountWebhookRoutes();
		this.logInfo('Agent Orchestrator initialized');
	}

	createSession(params: {
		userId: string;
		clientId: string;
		scopes: string[];
		mcpServerName: string;
		mcpSessionId?: string;
	}): DB_AgentSession {
		const session: DB_AgentSession = {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: 'agent--sessions',
			userId: params.userId,
			clientId: params.clientId,
			scopes: params.scopes,
			mcpServerName: params.mcpServerName,
			mcpSessionId: params.mcpSessionId,
			status: 'active',
			lastActivityAt: Date.now(),
		} as DB_AgentSession;

		this.sessions.set(session._id, session);
		this.logInfo(`Agent session created: ${session._id} (user: ${session.userId})`);
		return session;
	}

	async createAsyncTask(params: {
		agentSessionId: string;
		toolName: string;
		input?: Record<string, unknown>;
		ttlMs?: number;
	}): Promise<DB_WorkflowTask> {
		const task: DB_WorkflowTask = {
			_id: randomUUID(),
			__created: Date.now(),
			__updated: Date.now(),
			_v: 'agent--workflow-tasks',
			agentSessionId: params.agentSessionId,
			toolName: params.toolName,
			status: 'pending',
			input: params.input,
			ttlMs: params.ttlMs ?? 3_600_000,
		} as DB_WorkflowTask;

		this.tasks.set(task._id, task);
		this.logInfo(`Async task created: ${task._id} (tool: ${task.toolName})`);
		return task;
	}

	async requestHumanApproval(taskId: string, prompt: string, channel?: string): Promise<string> {
		const task = this.tasks.get(taskId);
		if (!task)
			throw new Error(`Task not found: ${taskId}`);

		task.status = 'waiting_human';
		const gateId = randomUUID();
		task.gateId = gateId;

		const request = {taskId, prompt, channel};
		const providers = dispatcher_HumanGateProvider.filterModules();

		if (providers.length === 0) {
			this.logWarningBold('No HumanGateProvider registered — gate will remain pending');
		} else {
			await dispatcher_HumanGateProvider.dispatchModuleAsync(request);
		}

		this.logInfo(`Human gate opened: ${gateId} (task: ${taskId})`);
		return gateId;
	}

	resolveGate(gateId: string, response: HumanGateResponse): void {
		for (const task of this.tasks.values()) {
			if (task.gateId === gateId) {
				task.status = 'completed';
				task.result = {humanResponse: response.response, respondedBy: response.respondedBy};
				this.logInfo(`Gate resolved: ${gateId} (task: ${task._id})`);

				const resolver = this.pendingGates.get(gateId);
				if (resolver) {
					resolver(response);
					this.pendingGates.delete(gateId);
				}
				return;
			}
		}

		this.logWarning(`Gate not found: ${gateId}`);
	}

	updateTaskStatus(taskId: string, status: WorkflowStatus, result?: Record<string, unknown>, error?: string): void {
		const task = this.tasks.get(taskId);
		if (!task)
			throw new Error(`Task not found: ${taskId}`);

		task.status = status;
		if (result)
			task.result = result;
		if (error)
			task.error = error;

		task.__updated = Date.now();
		this.logInfo(`Task ${taskId} → ${status}`);
	}

	getTask(taskId: string): DB_WorkflowTask | undefined {
		return this.tasks.get(taskId);
	}

	getSessionTasks(sessionId: string): DB_WorkflowTask[] {
		return Array.from(this.tasks.values()).filter(t => t.agentSessionId === sessionId);
	}

	getActiveSessions(): DB_AgentSession[] {
		return Array.from(this.sessions.values()).filter(s => s.status === 'active');
	}

	terminateSession(sessionId: string): void {
		const session = this.sessions.get(sessionId);
		if (!session)
			return;

		session.status = 'terminated';
		this.logInfo(`Agent session terminated: ${sessionId}`);
	}

	private mountWebhookRoutes(): void {
		const express = HttpServer.getDefault().getExpress();
		const basePath = this.config.webhookBasePath;

		express.post(`${basePath}/gate/:gateId`, (req, res) => {
			const gateId = req.params['gateId'];
			const {response, respondedBy} = req.body;

			if (!response) {
				res.status(400).json({error: 'response field is required'});
				return;
			}

			const gateResponse: HumanGateResponse = {
				gateId,
				taskId: '',
				respondedBy,
				response,
				respondedAt: Date.now(),
			};

			this.resolveGate(gateId, gateResponse);
			res.status(200).json({ok: true});
		});

		this.logInfo(`Webhook endpoint mounted at POST ${basePath}/gate/:gateId`);
	}
}

export const ModuleBE_AgentOrchestrator = new ModuleBE_AgentOrchestrator_Class();
