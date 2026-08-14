/*
 * @nu-art/build-and-install - Resolve BAI template params (config + env overlay)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {BadImplementationException, StringMap, TypedMap} from '@nu-art/ts-common';
import {DEFAULT_TEMPLATE_PATTERN, FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {BAI_Config} from '../config/types/project-config.js';
import {FilesCache} from './FilesCache.js';


const INTEGER_STRING = /^-?\d+$/;

export type BaiTemplateParamValue = string | number;
export type BaiTemplateParamMap = TypedMap<BaiTemplateParamValue>;

const stringifyParamMap = (map: BaiTemplateParamMap): StringMap => {
	const out: StringMap = {};
	for (const [key, value] of Object.entries(map)) {
		if (value === undefined || value === null)
			continue;
		out[key] = String(value);
	}
	return out;
};

const envAsParamMap = (env: NodeJS.Dict<string>): StringMap => {
	const out: StringMap = {};
	for (const [key, value] of Object.entries(env)) {
		if (value === undefined)
			continue;
		out[key] = value;
	}
	return out;
};

const assertParam = (params: StringMap, param: string) => {
	if (!Object.hasOwn(params, param))
		throw new BadImplementationException(`Missing template param: ${param}`);
	if (params[param] === undefined || params[param] === '')
		throw new BadImplementationException(`Template param value is empty: ${param}`);
};

/**
 * packageJson templates + params from bai-config, then every env var into the
 * same map. Env wins on a matching key.
 */
export const resolveBaiTemplateParams = (baiConfig: BAI_Config, env: NodeJS.Dict<string> = process.env): StringMap => {
	const packageJson = stringifyParamMap(baiConfig.templateParams?.packageJson ?? {});
	const defaults = stringifyParamMap(baiConfig.templateParams?.params ?? {});
	return {...packageJson, ...defaults, ...envAsParamMap(env)};
};

/**
 * Substitute `{{param}}` in a JSON document. A value that is exactly `"{{param}}"`
 * is unquoted when the param is an integer so unitConfig ports stay numbers.
 */
export const transformJsonTemplate = (input: string, params: StringMap): string => {
	const afterQuoted = input.replace(/"\{\{(\S+?)\}\}"/g, (_match, param: string) => {
		assertParam(params, param);
		const value = params[param];
		return INTEGER_STRING.test(value) ? value : JSON.stringify(value);
	});
	if (!DEFAULT_TEMPLATE_PATTERN.test(afterQuoted))
		return afterQuoted;

	return FileSystemUtils.file.template.transform(afterQuoted, params);
};

export const loadJsonWithTemplateParams = async <T>(pathToFile: string, params: StringMap): Promise<T> => {
	const text = await FilesCache.load.text(pathToFile);
	if (!/\{\{\S+?\}\}/.test(text))
		return JSON.parse(text) as T;

	return JSON.parse(transformJsonTemplate(text, params)) as T;
};
