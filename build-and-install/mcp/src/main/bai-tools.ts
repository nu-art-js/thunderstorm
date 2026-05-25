/*
 * BAI MCP tool definitions — maps high-level operations to BAI CLI flags
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

export type BaiToolInput = {
	projectPath: string;
	flags: string[];
};

export type BaiToolDef = {
	name: string;
	description: string;
	inputSchema: Record<string, unknown>;
	buildFlags: (input: Record<string, unknown>) => string[];
};

const projectPathProperty = {
	type: 'string' as const,
	description: 'Absolute path to the project root where build-and-install.sh lives',
};

export const baiTools: BaiToolDef[] = [
	{
		name: 'bai_init',
		description: 'Clean install and setup the monorepo — runs the full bash bootstrap to install dependencies, link packages, and configure the workspace from scratch. Use when node_modules are missing, corrupted, or after major dependency changes.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
			},
			required: ['projectPath'],
		},
		buildFlags: () => ['--install', '--purge'],
	},
	{
		name: 'bai_install',
		description: 'Install dependencies without rebuilding — runs pnpm install and links packages. Use after adding or changing dependencies in __package.json files.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
			},
			required: ['projectPath'],
		},
		buildFlags: () => ['--install'],
	},
	{
		name: 'bai_build',
		description: 'Build all packages or a specific package. Runs prepare + compile phases. Use after code changes to verify the project compiles.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
				package: {
					type: 'string',
					description: 'Regex pattern to match package names (e.g. "market-prediction-shared"). Omit to build all packages.',
				},
				buildTree: {
					type: 'boolean',
					description: 'When true, also builds transitive dependencies of the matched package(s) if they need rebuilding.',
				},
			},
			required: ['projectPath'],
		},
		buildFlags: (input) => {
			const flags: string[] = [];
			if (input.package)
				flags.push(`--use-package=${input.package}`);

			if (input.buildTree)
				flags.push('--build-tree');

			return flags;
		},
	},
	{
		name: 'bai_test',
		description: 'Run tests for all packages or a specific package. Supports filtering by test type (pure/firebase/playwright), specific test files, or specific test case names.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
				package: {
					type: 'string',
					description: 'Regex pattern to match package names. Omit to test all packages.',
				},
				testType: {
					type: 'string',
					enum: ['pure', 'firebase', 'playwright'],
					description: 'Filter by test type. "pure" = standard TypeScript tests, "firebase" = tests with Firebase emulators, "playwright" = browser tests.',
				},
				testFile: {
					type: 'string',
					description: 'Glob pattern to run specific test files (e.g. "**/*.test.ts").',
				},
				testCase: {
					type: 'string',
					description: 'Grep pattern to run specific test cases by name. Supports regex and pipe-separated patterns (e.g. "Build|Deploy").',
				},
			},
			required: ['projectPath'],
		},
		buildFlags: (input) => {
			const flags = ['--test'];
			if (input.package)
				flags.push(`--use-package=${input.package}`);

			if (input.testType)
				flags.push(`--test-type=${input.testType}`);

			if (input.testFile)
				flags.push(`--test-file=${input.testFile}`);

			if (input.testCase)
				flags.push(`--test-case=${input.testCase}`);

			return flags;
		},
	},
	{
		name: 'bai_continue',
		description: 'Resume from where a previous build left off after a failure. Picks up from the last failed package/phase.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
			},
			required: ['projectPath'],
		},
		buildFlags: () => ['--continue'],
	},
	{
		name: 'bai_launch',
		description: 'Launch an application without rebuilding. Skips the build phase and starts the app directly. Requires specifying which app package to launch.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
				package: {
					type: 'string',
					description: 'Regex pattern to match the app package to launch (e.g. "app-backend").',
				},
				debug: {
					type: 'boolean',
					description: 'When true, launches the backend in debug mode.',
				},
			},
			required: ['projectPath', 'package'],
		},
		buildFlags: (input) => {
			const flags = ['--no-build', '--launch', `--use-package=${input.package}`];
			if (input.debug)
				flags.push('--debug-backend');

			return flags;
		},
	},
	{
		name: 'bai_clean',
		description: 'Delete dist/ and dist-test/ in all packages. Use to force a clean rebuild.',
		inputSchema: {
			type: 'object',
			properties: {
				projectPath: projectPathProperty,
			},
			required: ['projectPath'],
		},
		buildFlags: () => ['--clean'],
	},
];
