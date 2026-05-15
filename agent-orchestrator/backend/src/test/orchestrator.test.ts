/*
 * @nu-art/agent-orchestrator-backend - Agent orchestrator for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ModuleBE_AgentOrchestrator_Class} from '../main/modules/ModuleBE_AgentOrchestrator.js';

const createOrchestrator = (): ModuleBE_AgentOrchestrator_Class => new ModuleBE_AgentOrchestrator_Class();

const createSessionParams = (overrides?: Partial<Parameters<ModuleBE_AgentOrchestrator_Class['createSession']>[0]>) => ({
	userId: 'user-1',
	clientId: 'client-1',
	scopes: ['read'],
	mcpServerName: 'default',
	...overrides,
});

describe('Agent session management', () => {
	it('creates a session with active status', () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());

		expect(session.status).to.equal('active');
		expect(session.userId).to.equal('user-1');
		expect(session.clientId).to.equal('client-1');
		expect(session._id).to.be.a('string');
	});

	it('lists active sessions', () => {
		const orch = createOrchestrator();
		orch.createSession(createSessionParams({userId: 'user-a'}));
		orch.createSession(createSessionParams({userId: 'user-b'}));

		const active = orch.getActiveSessions();
		expect(active).to.have.lengthOf(2);
	});

	it('terminates a session and excludes it from active list', () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());

		orch.terminateSession(session._id);

		expect(orch.getActiveSessions()).to.have.lengthOf(0);
	});

	it('terminateSession is a no-op for unknown session id', () => {
		const orch = createOrchestrator();
		orch.terminateSession('nonexistent');
		expect(orch.getActiveSessions()).to.have.lengthOf(0);
	});

	it('assigns unique ids to each session', () => {
		const orch = createOrchestrator();
		const s1 = orch.createSession(createSessionParams());
		const s2 = orch.createSession(createSessionParams());
		expect(s1._id).to.not.equal(s2._id);
	});
});

describe('Async task lifecycle', () => {
	it('creates a task with pending status', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 'test:tool'});

		expect(task.status).to.equal('pending');
		expect(task.toolName).to.equal('test:tool');
		expect(task.agentSessionId).to.equal(session._id);
	});

	it('retrieves a task by id', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 'lookup:tool'});

		const found = orch.getTask(task._id);
		expect(found).to.not.be.undefined;
		expect(found!._id).to.equal(task._id);
	});

	it('returns undefined for unknown task id', () => {
		const orch = createOrchestrator();
		expect(orch.getTask('nonexistent')).to.be.undefined;
	});

	it('lists tasks by session id', async () => {
		const orch = createOrchestrator();
		const s1 = orch.createSession(createSessionParams({userId: 'u1'}));
		const s2 = orch.createSession(createSessionParams({userId: 'u2'}));

		await orch.createAsyncTask({agentSessionId: s1._id, toolName: 'a'});
		await orch.createAsyncTask({agentSessionId: s1._id, toolName: 'b'});
		await orch.createAsyncTask({agentSessionId: s2._id, toolName: 'c'});

		expect(orch.getSessionTasks(s1._id)).to.have.lengthOf(2);
		expect(orch.getSessionTasks(s2._id)).to.have.lengthOf(1);
	});

	it('uses default ttlMs when not specified', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't'});

		expect(task.ttlMs).to.equal(3_600_000);
	});

	it('uses custom ttlMs when specified', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't', ttlMs: 30_000});

		expect(task.ttlMs).to.equal(30_000);
	});
});

describe('Task status transitions', () => {
	it('transitions pending → running', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't'});

		orch.updateTaskStatus(task._id, 'running');
		expect(orch.getTask(task._id)!.status).to.equal('running');
	});

	it('transitions running → completed with result', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't'});

		orch.updateTaskStatus(task._id, 'running');
		orch.updateTaskStatus(task._id, 'completed', {output: 'done'});

		const updated = orch.getTask(task._id)!;
		expect(updated.status).to.equal('completed');
		expect(updated.result).to.deep.equal({output: 'done'});
	});

	it('transitions running → failed with error', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't'});

		orch.updateTaskStatus(task._id, 'running');
		orch.updateTaskStatus(task._id, 'failed', undefined, 'Timeout exceeded');

		const updated = orch.getTask(task._id)!;
		expect(updated.status).to.equal('failed');
		expect(updated.error).to.equal('Timeout exceeded');
	});

	it('transitions pending → cancelled', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't'});

		orch.updateTaskStatus(task._id, 'cancelled');
		expect(orch.getTask(task._id)!.status).to.equal('cancelled');
	});

	it('throws for unknown task id', () => {
		const orch = createOrchestrator();
		expect(() => orch.updateTaskStatus('nonexistent', 'running')).to.throw('Task not found');
	});

	it('updates __updated timestamp on status change', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 't'});
		const originalUpdated = task.__updated;

		await new Promise(r => setTimeout(r, 5));
		orch.updateTaskStatus(task._id, 'running');

		expect(orch.getTask(task._id)!.__updated).to.be.greaterThanOrEqual(originalUpdated);
	});
});

describe('Gate resolution', () => {
	it('resolves a gate and sets task to completed', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const task = await orch.createAsyncTask({agentSessionId: session._id, toolName: 'gate:test'});

		orch.updateTaskStatus(task._id, 'waiting_human');
		const gateId = 'test-gate-1';
		task.gateId = gateId;

		orch.resolveGate(gateId, {
			gateId,
			taskId: task._id,
			response: 'approved',
			respondedBy: 'human-user',
			respondedAt: Date.now(),
		});

		const resolved = orch.getTask(task._id)!;
		expect(resolved.status).to.equal('completed');
		expect(resolved.result).to.deep.include({humanResponse: 'approved', respondedBy: 'human-user'});
	});

	it('requestHumanApproval throws for unknown task', async () => {
		const orch = createOrchestrator();
		try {
			await orch.requestHumanApproval('nonexistent', 'question');
			expect.fail('Should have thrown');
		} catch (err: any) {
			expect(err.message).to.include('Task not found');
		}
	});

	it('resolveGate is a no-op for unknown gate id', () => {
		const orch = createOrchestrator();
		orch.resolveGate('unknown-gate', {
			gateId: 'unknown-gate',
			taskId: '',
			response: 'yes',
			respondedAt: Date.now(),
		});
	});

	it('resolveGate only affects the matching task', async () => {
		const orch = createOrchestrator();
		const session = orch.createSession(createSessionParams());
		const t1 = await orch.createAsyncTask({agentSessionId: session._id, toolName: 'g1'});
		const t2 = await orch.createAsyncTask({agentSessionId: session._id, toolName: 'g2'});

		orch.updateTaskStatus(t1._id, 'waiting_human');
		t1.gateId = 'gate-a';
		orch.updateTaskStatus(t2._id, 'waiting_human');
		t2.gateId = 'gate-b';

		orch.resolveGate('gate-a', {
			gateId: 'gate-a',
			taskId: t1._id,
			response: 'yes',
			respondedAt: Date.now(),
		});

		expect(orch.getTask(t1._id)!.status).to.equal('completed');
		expect(orch.getTask(t2._id)!.status).to.equal('waiting_human');
	});
});
