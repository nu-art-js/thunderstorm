/*
 * @nu-art/firebase-backend — compile a DB index into Mongo createIndex args
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {asArray, BadImplementationException} from '@nu-art/ts-common';
import type {CreateIndexesOptions, IndexSpecification} from 'mongodb';

type MongoIndexOptions = {
	keys: readonly {field: string; direction?: 1 | -1 | 'text'}[];
	defaultLanguage?: string;
	weights?: Readonly<Record<string, number>>;
};

export type CompiledMongoIndex = {
	spec: IndexSpecification;
	options: CreateIndexesOptions;
};

type IndexDecl = {
	id: string;
	keys: unknown;
	params?: {unique?: boolean};
	mongo?: MongoIndexOptions;
};

const isText = (idx: IndexDecl): boolean =>
	idx.mongo?.keys.some(key => key.direction === 'text') ?? false;

export const compileMongoIndex = (idx: IndexDecl): CompiledMongoIndex => {
	const unique = idx.params?.unique ?? false;
	if (!idx.mongo) {
		const spec = asArray(idx.keys as string | string[]).reduce<Record<string, 1>>((acc, key) => {
			acc[String(key)] = 1;
			return acc;
		}, {});
		return {spec, options: {name: idx.id, unique}};
	}

	if (idx.mongo.keys.length === 0)
		throw new BadImplementationException(`Mongo index '${idx.id}' has no keys`);

	const spec: Record<string, 1 | -1 | 'text'> = {};
	for (const key of idx.mongo.keys) {
		if (!key.field)
			throw new BadImplementationException(`Mongo index '${idx.id}' has an empty field`);
		if (Object.prototype.hasOwnProperty.call(spec, key.field))
			throw new BadImplementationException(`Mongo index '${idx.id}' repeats field '${key.field}'`);

		spec[key.field] = key.direction ?? 1;
	}

	const text = isText(idx);
	if (text && unique)
		throw new BadImplementationException(`Mongo index '${idx.id}' cannot be unique and text`);
	if (!text && (idx.mongo.weights !== undefined || idx.mongo.defaultLanguage !== undefined))
		throw new BadImplementationException(`Mongo index '${idx.id}' sets text options without a text key`);

	const options: CreateIndexesOptions = {name: idx.id, unique};
	if (idx.mongo.weights)
		options.weights = {...idx.mongo.weights};
	if (idx.mongo.defaultLanguage)
		options.default_language = idx.mongo.defaultLanguage;

	return {spec, options};
};

/** Mongo allows one text index per collection. Fail before any createIndex call. */
export const assertOneTextIndex = (indices: readonly IndexDecl[]): void => {
	const textIds = indices.filter(isText).map(idx => idx.id);
	if (textIds.length > 1)
		throw new BadImplementationException(`Only one text index is allowed per collection: ${textIds.join(', ')}`);
};
