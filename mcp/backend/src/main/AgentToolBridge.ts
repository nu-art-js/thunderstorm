/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {Logger} from '@nu-art/ts-common';
import {ModuleBE_AgentTools} from '@nu-art/ts-agent-tools-backend';
import type {TS_AgentTool} from '@nu-art/ts-agent-tools-backend';
import type {McpToolDefinition, McpToolRegistration} from '@nu-art/mcp-shared';

/**
 * Bridges existing TS_AgentTool registrations into MCP tool registrations.
 * Converts JSON Schema input definitions to MCP-compatible tool definitions
 * and wraps execute functions to produce McpToolResult output.
 */
export class AgentToolBridge
	extends Logger {

	constructor() {
		super('AgentToolBridge');
	}

	bridgeAll(): McpToolRegistration[] {
		const agentTools = ModuleBE_AgentTools.getAllTools();
		const registrations: McpToolRegistration[] = agentTools.map(tool => this.bridgeTool(tool));

		this.logInfo(`Bridged ${registrations.length} TS_AgentTool(s) to MCP`);
		return registrations;
	}

	private bridgeTool(tool: TS_AgentTool<any, any>): McpToolRegistration {
		const definition: McpToolDefinition = {
			name: tool.name,
			description: tool.inputSchema.description ?? tool.name,
			inputSchema: this.convertJsonSchemaToPlain(tool.inputSchema),
			annotations: {idempotentHint: true},
		};

		return {
			definition,
			handler: async (input, _ctx) => {
				try {
					const result = await tool.execute(input);
					const text = typeof result === 'string' ? result : JSON.stringify(result, null, 2);
					return {content: [{type: 'text', text}]};
				} catch (err: any) {
					return {
						content: [{type: 'text', text: `Tool execution failed: ${err.message ?? err}`}],
						isError: true,
					};
				}
			},
		};
	}

	private convertJsonSchemaToPlain(schema: any): Record<string, unknown> {
		const result: Record<string, unknown> = {type: schema.type};

		if (schema.description)
			result['description'] = schema.description;

		if (schema.properties) {
			const props: Record<string, unknown> = {};
			for (const [key, propSchema] of Object.entries(schema.properties)) {
				props[key] = this.convertJsonSchemaToPlain(propSchema);
			}
			result['properties'] = props;
		}

		if (schema.required)
			result['required'] = schema.required;

		if (schema.items)
			result['items'] = this.convertJsonSchemaToPlain(schema.items);

		if (schema.enum)
			result['enum'] = schema.enum;

		if (schema.default !== undefined)
			result['default'] = schema.default;

		if (schema.minimum !== undefined)
			result['minimum'] = schema.minimum;

		if (schema.maximum !== undefined)
			result['maximum'] = schema.maximum;

		if (schema.pattern)
			result['pattern'] = schema.pattern;

		return result;
	}
}
