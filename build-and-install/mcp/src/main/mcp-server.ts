#!/usr/bin/env node
/*
 * BAI MCP Server — local stdio MCP server for Build-And-Install operations
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {McpServer} from '@modelcontextprotocol/sdk/server/mcp.js';
import {StdioServerTransport} from '@modelcontextprotocol/sdk/server/stdio.js';
import {spawn} from 'node:child_process';
import {existsSync} from 'node:fs';
import {resolve} from 'node:path';
import {baiTools} from './bai-tools.js';


function executeBai(projectPath: string, flags: string[]): Promise<{ exitCode: number; stdout: string; stderr: string }> {
	return new Promise((resolve, reject) => {
		const scriptPath = 'build-and-install.sh';
		const child = spawn('bash', [scriptPath, ...flags], {
			cwd: projectPath,
			env: {...process.env, FORCE_COLOR: '0'},
			stdio: ['ignore', 'pipe', 'pipe'],
		});

		let stdout = '';
		let stderr = '';

		child.stdout.on('data', (data: Buffer) => {
			stdout += data.toString();
		});

		child.stderr.on('data', (data: Buffer) => {
			stderr += data.toString();
		});

		child.on('error', (err) => {
			reject(new Error(`Failed to spawn BAI: ${err.message}`));
		});

		child.on('close', (code) => {
			resolve({exitCode: code ?? 1, stdout, stderr});
		});
	});
}

async function main() {
	const server = new McpServer({
		name: 'bai-mcp',
		version: '1.0.0',
	});

	for (const tool of baiTools) {
		server.tool(
			tool.name,
			tool.description,
			tool.inputSchema,
			async (input: Record<string, unknown>) => {
				const projectPath = input.projectPath as string;
				const resolved = resolve(projectPath);

				if (!existsSync(resolved)) {
					return {
						content: [{type: 'text' as const, text: `Error: project path does not exist: ${resolved}`}],
						isError: true,
					};
				}

				const scriptFile = resolve(resolved, 'build-and-install.sh');
				if (!existsSync(scriptFile)) {
					return {
						content: [{type: 'text' as const, text: `Error: build-and-install.sh not found at ${resolved}`}],
						isError: true,
					};
				}

				const flags = tool.buildFlags(input);

				try {
					const result = await executeBai(resolved, flags);
					const output = [
						`Command: bash build-and-install.sh ${flags.join(' ')}`,
						`Exit code: ${result.exitCode}`,
						'',
						'--- stdout ---',
						result.stdout || '(empty)',
						'',
						'--- stderr ---',
						result.stderr || '(empty)',
					].join('\n');

					return {
						content: [{type: 'text' as const, text: output}],
						isError: result.exitCode !== 0,
					};
				} catch (err) {
					return {
						content: [{type: 'text' as const, text: `Error executing BAI: ${err instanceof Error ? err.message : String(err)}`}],
						isError: true,
					};
				}
			},
		);
	}

	const transport = new StdioServerTransport();
	await server.connect(transport);
}

main().catch((err) => {
	process.stderr.write(`BAI MCP server failed to start: ${err}\n`);
	process.exit(1);
});
