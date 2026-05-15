/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ModuleBE_AgentTools} from '@nu-art/ts-agent-tools-backend';
import type {TS_AgentTool, JSON_Schema} from '@nu-art/ts-agent-tools-backend';
import {AgentToolBridge} from '../main/AgentToolBridge.js';

const bridge = new AgentToolBridge();

const createAgentTool = <T extends Record<string, any>>(
	name: string,
	inputSchema: JSON_Schema<T>,
	execute: (args: T) => Promise<any> = async () => 'ok',
): TS_AgentTool<T, any> => ({name, inputSchema, execute});

describe('AgentToolBridge', () => {
	afterEach(() => {
		ModuleBE_AgentTools.clearTools();
	});

	describe('bridgeAll', () => {
		it('returns empty array when no agent tools are registered', () => {
			const result = bridge.bridgeAll();
			expect(result).to.have.lengthOf(0);
		});

		it('bridges a single registered tool', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('greet', {
				type: 'object',
				description: 'Greet someone',
				properties: {name: {type: 'string', description: 'Who to greet'}},
				required: ['name'],
			} as any));

			const registrations = bridge.bridgeAll();
			expect(registrations).to.have.lengthOf(1);
			expect(registrations[0].definition.name).to.equal('greet');
			expect(registrations[0].definition.description).to.equal('Greet someone');
		});

		it('bridges multiple registered tools preserving names', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('tool-a', {type: 'object', description: 'A', properties: {}, required: []} as any));
			ModuleBE_AgentTools.registerTool(createAgentTool('tool-b', {type: 'object', description: 'B', properties: {}, required: []} as any));

			const names = bridge.bridgeAll().map(r => r.definition.name);
			expect(names).to.include('tool-a');
			expect(names).to.include('tool-b');
		});
	});

	describe('JSON Schema conversion', () => {
		it('converts object schema with string properties', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('obj-tool', {
				type: 'object',
				description: 'Object tool',
				properties: {
					field: {type: 'string', description: 'A field'},
				},
				required: ['field'],
			} as any));

			const reg = bridge.bridgeAll()[0];
			const schema = reg.definition.inputSchema as Record<string, any>;
			expect(schema.type).to.equal('object');
			expect(schema.properties.field.type).to.equal('string');
			expect(schema.properties.field.description).to.equal('A field');
			expect(schema.required).to.deep.equal(['field']);
		});

		it('converts number schema with min/max', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('num-tool', {
				type: 'object',
				description: 'Num tool',
				properties: {
					count: {type: 'number', description: 'Count', minimum: 0, maximum: 100},
				},
				required: ['count'],
			} as any));

			const reg = bridge.bridgeAll()[0];
			const countSchema = (reg.definition.inputSchema as any).properties.count;
			expect(countSchema.type).to.equal('number');
			expect(countSchema.minimum).to.equal(0);
			expect(countSchema.maximum).to.equal(100);
		});

		it('converts string enum schema', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('enum-tool', {
				type: 'object',
				description: 'Enum tool',
				properties: {
					mode: {type: 'string', description: 'Mode', enum: ['fast', 'slow'] as const},
				},
				required: ['mode'],
			} as any));

			const reg = bridge.bridgeAll()[0];
			const modeSchema = (reg.definition.inputSchema as any).properties.mode;
			expect(modeSchema.enum).to.deep.equal(['fast', 'slow']);
		});

		it('converts array schema with items', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('arr-tool', {
				type: 'object',
				description: 'Array tool',
				properties: {
					tags: {type: 'array', description: 'Tags', items: {type: 'string', description: 'Tag'}},
				},
				required: ['tags'],
			} as any));

			const reg = bridge.bridgeAll()[0];
			const tagsSchema = (reg.definition.inputSchema as any).properties.tags;
			expect(tagsSchema.type).to.equal('array');
			expect(tagsSchema.items.type).to.equal('string');
		});

		it('converts string with pattern', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('pattern-tool', {
				type: 'object',
				description: 'Pattern tool',
				properties: {
					email: {type: 'string', description: 'Email', pattern: '^.+@.+\\..+$'},
				},
				required: ['email'],
			} as any));

			const reg = bridge.bridgeAll()[0];
			const emailSchema = (reg.definition.inputSchema as any).properties.email;
			expect(emailSchema.pattern).to.equal('^.+@.+\\..+$');
		});

		it('uses tool name as description fallback when schema has no description', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('no-desc', {
				type: 'object',
				properties: {},
				required: [],
			} as any));

			const reg = bridge.bridgeAll()[0];
			expect(reg.definition.description).to.equal('no-desc');
		});

		it('preserves default values', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('default-tool', {
				type: 'object',
				description: 'Default tool',
				properties: {
					limit: {type: 'number', description: 'Limit', default: 10},
				},
				required: [],
			} as any));

			const reg = bridge.bridgeAll()[0];
			const limitSchema = (reg.definition.inputSchema as any).properties.limit;
			expect(limitSchema.default).to.equal(10);
		});
	});

	describe('handler wrapping', () => {
		it('wraps string result as text content', async () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('str-result', {
				type: 'object', description: 'S', properties: {}, required: [],
			} as any, async () => 'hello world'));

			const reg = bridge.bridgeAll()[0];
			const result = await reg.handler({}, {serverName: 'test'});

			expect(result.content).to.have.lengthOf(1);
			const item = result.content[0];
			expect(item.type).to.equal('text');
			if (item.type === 'text')
				expect(item.text).to.equal('hello world');

			expect(result.isError).to.be.undefined;
		});

		it('wraps object result as JSON text content', async () => {
			const data = {status: 'ok', count: 42};
			ModuleBE_AgentTools.registerTool(createAgentTool('obj-result', {
				type: 'object', description: 'O', properties: {}, required: [],
			} as any, async () => data));

			const reg = bridge.bridgeAll()[0];
			const result = await reg.handler({}, {serverName: 'test'});

			const item = result.content[0];
			expect(item.type).to.equal('text');
			if (item.type === 'text') {
				const parsed = JSON.parse(item.text);
				expect(parsed).to.deep.equal(data);
			}
		});

		it('passes input arguments through to the tool execute function', async () => {
			let receivedArgs: any;
			ModuleBE_AgentTools.registerTool(createAgentTool('echo-args', {
				type: 'object', description: 'E', properties: {x: {type: 'number', description: 'X'}}, required: ['x'],
			} as any, async (args) => {
				receivedArgs = args;
				return 'done';
			}));

			const reg = bridge.bridgeAll()[0];
			await reg.handler({x: 99}, {serverName: 'test'});

			expect(receivedArgs).to.deep.equal({x: 99});
		});

		it('returns isError true when tool throws', async () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('fail-tool', {
				type: 'object', description: 'F', properties: {}, required: [],
			} as any, async () => {
				throw new Error('Something went wrong');
			}));

			const reg = bridge.bridgeAll()[0];
			const result = await reg.handler({}, {serverName: 'test'});

			expect(result.isError).to.be.true;
			const item = result.content[0];
			expect(item.type).to.equal('text');
			if (item.type === 'text')
				expect(item.text).to.include('Something went wrong');
		});

		it('handles non-Error throws gracefully', async () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('throw-string', {
				type: 'object', description: 'T', properties: {}, required: [],
			} as any, async () => {
				throw 'raw string error';
			}));

			const reg = bridge.bridgeAll()[0];
			const result = await reg.handler({}, {serverName: 'test'});

			expect(result.isError).to.be.true;
			const item = result.content[0];
			expect(item.type).to.equal('text');
			if (item.type === 'text')
				expect(item.text).to.include('raw string error');
		});
	});

	describe('annotations', () => {
		it('sets idempotentHint to true on all bridged tools', () => {
			ModuleBE_AgentTools.registerTool(createAgentTool('any-tool', {
				type: 'object', description: 'A', properties: {}, required: [],
			} as any));

			const reg = bridge.bridgeAll()[0];
			expect(reg.definition.annotations?.idempotentHint).to.be.true;
		});
	});
});
