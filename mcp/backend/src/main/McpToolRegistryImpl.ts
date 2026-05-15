/*
 * @nu-art/mcp-backend - MCP Server backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {McpToolDefinition, McpToolHandler, McpToolRegistration, McpToolRegistry} from '@nu-art/mcp-shared';

export class McpToolRegistryImpl
	implements McpToolRegistry {

	private readonly registrations: McpToolRegistration[] = [];

	register<Input>(
		definition: McpToolDefinition<Input>,
		handler: McpToolHandler<Input>,
	): void {
		this.registrations.push({definition, handler});
	}

	getRegistrations(): McpToolRegistration[] {
		return this.registrations;
	}
}
