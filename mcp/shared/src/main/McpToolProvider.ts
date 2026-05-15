/*
 * @nu-art/mcp-shared - MCP Server shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {McpToolContext, McpToolDefinition, McpToolResult} from './types.js';

export type McpToolHandler<Input = any> = (input: Input, context: McpToolContext) => Promise<McpToolResult>;

export type McpToolRegistration<Input = any> = {
	definition: McpToolDefinition<Input>;
	handler: McpToolHandler<Input>;
};

export interface McpToolRegistry {
	register<Input>(
		definition: McpToolDefinition<Input>,
		handler: McpToolHandler<Input>,
	): void;
}

export interface McpToolProvider {
	registerMcpTools(registry: McpToolRegistry): void;
}

export interface McpResourceProvider {
	registerMcpResources(registry: McpResourceRegistry): void;
}

export type McpResourceHandler = (uri: URL, params: Record<string, string>) => Promise<McpResourceResult>;

export type McpResourceResult = {
	contents: { uri: string; text?: string; blob?: string; mimeType?: string }[];
};

export interface McpResourceRegistry {
	register(
		name: string,
		uri: string,
		metadata: { title?: string; description: string; mimeType?: string },
		handler: McpResourceHandler,
	): void;
}
