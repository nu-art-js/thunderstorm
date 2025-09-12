// schema-to-types.ts
import * as fs from 'node:fs';
import * as path from 'node:path';
import $RefParser from '@apidevtools/json-schema-ref-parser';
import {FetchingJSONSchemaStore, InputData, JSONSchemaInput, quicktype, TypeScriptTargetLanguage,} from 'quicktype-core';

type SchemaConfig = { input: string; output: string };
type BuildConfig = SchemaConfig[];

/**
 * Generate TypeScript defs from a JSON Schema file.
 * - Bundles all external $refs into a single schema object
 * - Emits only type/interface declarations (no runtime helpers)
 */
const generateTypeScriptType = async (inputPath: string, outputPath: string): Promise<void> => {
	// Inline external refs but keep internal $ref to avoid cycles
	const bundledSchema = await $RefParser.bundle(path.resolve(inputPath));

	const topLevelName = inferTopLevelName(outputPath, inputPath);

	const schemaInput = new JSONSchemaInput(new FetchingJSONSchemaStore());
	await schemaInput.addSource({
		name: topLevelName,
		schema: JSON.stringify(bundledSchema),
	});

	const inputData = new InputData();
	inputData.addInput(schemaInput);

	const {lines} = await quicktype({
		inputData,
		lang: new TypeScriptTargetLanguage(),
		rendererOptions: {'just-types': 'true'}, // <= only types/interfaces
	});

	const ts = [
		`// Generated from ${path.basename(inputPath)} — do not edit by hand.`,
		`// ${new Date().toISOString()}`,
		'',
		...lines,
		'',
	].join('\n');

	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, {recursive: true});

	fs.writeFileSync(outputPath, ts, 'utf8');
};

function inferTopLevelName(outputPath: string, fallbackPath: string): string {
	const base = path.basename(outputPath || fallbackPath).replace(/\.(d\.)?tsx?$/i, '').trim();
	const name = base.replace(/[^A-Za-z0-9_$]/g, '_'); // best-effort valid TS identifier
	return name.length ? name : 'Schema';
}

export const processConfig = async (configPath: string): Promise<void> => {
	const config: BuildConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
	for (const {input, output} of config) {
		await generateTypeScriptType(input, output);
	}
};
