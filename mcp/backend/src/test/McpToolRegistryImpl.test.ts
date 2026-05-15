/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {McpToolRegistryImpl} from '../main/McpToolRegistryImpl.js';
import type {McpToolDefinition, McpToolHandler} from '@nu-art/mcp-shared';

const createToolDef = (name: string, overrides?: Partial<McpToolDefinition>): McpToolDefinition => ({
	name,
	description: `Test tool: ${name}`,
	inputSchema: {},
	...overrides,
});

const noopHandler: McpToolHandler = async () => ({content: [{type: 'text', text: 'ok'}]});

describe('McpToolRegistryImpl', () => {
	it('starts with zero registrations', () => {
		const registry = new McpToolRegistryImpl();
		expect(registry.getRegistrations()).to.have.lengthOf(0);
	});

	it('registers a single tool and returns it', () => {
		const registry = new McpToolRegistryImpl();
		const def = createToolDef('test:single');

		registry.register(def, noopHandler);

		const registrations = registry.getRegistrations();
		expect(registrations).to.have.lengthOf(1);
		expect(registrations[0].definition.name).to.equal('test:single');
		expect(registrations[0].handler).to.equal(noopHandler);
	});

	it('registers multiple tools and preserves insertion order', () => {
		const registry = new McpToolRegistryImpl();
		registry.register(createToolDef('alpha'), noopHandler);
		registry.register(createToolDef('beta'), noopHandler);
		registry.register(createToolDef('gamma'), noopHandler);

		const names = registry.getRegistrations().map(r => r.definition.name);
		expect(names).to.deep.equal(['alpha', 'beta', 'gamma']);
	});

	it('preserves tool definition metadata', () => {
		const registry = new McpToolRegistryImpl();
		const def = createToolDef('scoped:tool', {
			requiredScopes: ['admin:read'],
			serverTarget: 'admin',
			annotations: {readOnlyHint: true},
		});

		registry.register(def, noopHandler);

		const reg = registry.getRegistrations()[0];
		expect(reg.definition.requiredScopes).to.deep.equal(['admin:read']);
		expect(reg.definition.serverTarget).to.equal('admin');
		expect(reg.definition.annotations?.readOnlyHint).to.be.true;
	});

	it('associates the correct handler with each tool', async () => {
		const registry = new McpToolRegistryImpl();
		const handlerA: McpToolHandler = async () => ({content: [{type: 'text', text: 'a'}]});
		const handlerB: McpToolHandler = async () => ({content: [{type: 'text', text: 'b'}]});

		registry.register(createToolDef('tool-a'), handlerA);
		registry.register(createToolDef('tool-b'), handlerB);

		const registrations = registry.getRegistrations();
		const resultA = await registrations[0].handler({}, {serverName: 'test'});
		const resultB = await registrations[1].handler({}, {serverName: 'test'});

		expect(resultA.content[0]).to.deep.include({type: 'text', text: 'a'});
		expect(resultB.content[0]).to.deep.include({type: 'text', text: 'b'});
	});

	it('allows duplicate tool names (no uniqueness enforcement at registry level)', () => {
		const registry = new McpToolRegistryImpl();
		registry.register(createToolDef('same-name'), noopHandler);
		registry.register(createToolDef('same-name'), noopHandler);

		expect(registry.getRegistrations()).to.have.lengthOf(2);
	});
});
