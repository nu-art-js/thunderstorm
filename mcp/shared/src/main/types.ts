/*
 * @nu-art/mcp-shared - MCP Server shared types for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type McpToolAnnotations = {
	title?: string;
	readOnlyHint?: boolean;
	destructiveHint?: boolean;
	idempotentHint?: boolean;
	openWorldHint?: boolean;
};

export type McpToolDefinition<Input = any, Output = any> = {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	outputSchema?: Record<string, unknown>;
	requiredScopes?: string[];
	annotations?: McpToolAnnotations;
	serverTarget?: string;
};

export type McpToolResult = {
	content: McpToolResultContent[];
	structuredContent?: Record<string, unknown>;
	isError?: boolean;
};

export type McpToolResultContent =
	| { type: 'text'; text: string }
	| { type: 'image'; data: string; mimeType: string }
	| { type: 'resource_link'; uri: string; name: string; mimeType?: string; description?: string };

export type McpToolContext = {
	authInfo?: McpAuthInfo;
	sessionId?: string;
	serverName: string;
};

export type McpAuthInfo = {
	clientId: string;
	scopes: string[];
	expiresAt?: number;
	token: string;
	extra?: Record<string, unknown>;
};

export type McpResourceDefinition = {
	name: string;
	uri: string;
	description: string;
	mimeType?: string;
	serverTarget?: string;
};

export type McpServerInstanceConfig = {
	name: string;
	pathPrefix: string;
	requiredScopes: string[];
	sessionTtlMs: number;
	instructions?: string;
};
