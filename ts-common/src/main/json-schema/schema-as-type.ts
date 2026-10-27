/*
 * ts-common — Print a JSON schema document as a TypeScript type
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === 'object' && value !== null && !Array.isArray(value);

const typeName = (name: string | undefined): string => {
	const ident = (name ?? '').trim().split(/[^A-Za-z0-9]+/).filter(Boolean)
		.map(word => word[0].toUpperCase() + word.slice(1))
		.join('');
	if (!ident)
		return 'Schema';

	return /^[0-9]/.test(ident) ? `T${ident}` : ident;
};

const fieldKey = (name: string): string =>
	/^[A-Za-z_$][A-Za-z0-9_$]*$/.test(name) ? name : JSON.stringify(name);

const flat = (text: string): string => text.replace(/\s+/g, ' ').trim();

const enumType = (node: Record<string, unknown>): string | undefined => {
	if (!Array.isArray(node.enum) || node.enum.length === 0)
		return undefined;

	return node.enum.map(entry => {
		if (typeof entry === 'string')
			return JSON.stringify(entry);
		if (typeof entry === 'number' || typeof entry === 'boolean')
			return String(entry);

		return 'unknown';
	}).join(' | ');
};

const comment = (node: Record<string, unknown>): string => {
	const notes: string[] = [];
	if (typeof node.description === 'string' && flat(node.description))
		notes.push(flat(node.description));
	if (node.type === 'integer')
		notes.push('integer');
	if (typeof node.minLength === 'number')
		notes.push(`minLength ${node.minLength}`);
	if (typeof node.maxLength === 'number')
		notes.push(`maxLength ${node.maxLength}`);
	if (typeof node.pattern === 'string')
		notes.push(`pattern ${node.pattern}`);
	return notes.length ? ` // ${notes.join(', ')}` : '';
};

const scalar = (type: unknown): string => {
	if (type === 'integer')
		return 'number';
	if (type === 'string' || type === 'number' || type === 'boolean')
		return type;

	return 'unknown';
};

const renderNode = (node: unknown, indent: number): string => {
	if (!isRecord(node))
		return 'unknown';

	const union = enumType(node);
	if (union)
		return union;
	if (node.type === 'array')
		return renderArray(node, indent);
	if (node.type === 'object')
		return renderObject(node, indent);

	return scalar(node.type);
};

const renderArray = (node: Record<string, unknown>, indent: number): string => {
	const item = renderNode(node.items, indent);
	if (item.startsWith('{') || item.includes('|'))
		return `Array<${item}>`;

	return `${item}[]`;
};

const renderObject = (node: Record<string, unknown>, indent: number): string => {
	const properties = isRecord(node.properties) ? node.properties : {};
	const required = new Set(
		Array.isArray(node.required)
			? node.required.filter((name): name is string => typeof name === 'string')
			: [],
	);
	const pad = '  '.repeat(indent + 1);
	const lines: string[] = [];
	for (const [key, child] of Object.entries(properties)) {
		const optional = required.has(key) ? '' : '?';
		const rendered = renderNode(child, indent + 1);
		const note = !rendered.includes('\n') && isRecord(child) ? comment(child) : '';
		lines.push(`${pad}${fieldKey(key)}${optional}: ${rendered};${note}`);
	}
	if (node.additionalProperties === true)
		lines.push(`${pad}[key: string]: unknown;`);
	if (lines.length === 0)
		return node.additionalProperties === true ? 'Record<string, unknown>' : '{}';

	return `{\n${lines.join('\n')}\n${'  '.repeat(indent)}}`;
};

/** Default view of a schema: a TypeScript type. enum is a union. description is a comment. */
export const schemaAsType = (name: string | undefined, schema: Record<string, unknown>): string =>
	`type ${typeName(name)} = ${renderNode(schema, 0)};`;
