import * as fs from 'fs';
import * as path from 'path';
import {compileFromFile, Options} from 'json-schema-to-typescript';

type SchemaConfig = {
	input: string;
	output: string;
};

type BuildConfig = SchemaConfig[];

const generateTypeScriptType = async (inputPath: string, outputPath: string): Promise<void> => {
	const options: Partial<Options> = {
		$refOptions: {
			resolve: {
				// Resolves local file references
				file: {
					read(file) {
						const filePath = path.resolve(path.dirname(inputPath), file.url);
						return fs.promises.readFile(filePath, 'utf8');
					}
				}
			}
		}
	};

	const ts = await compileFromFile(inputPath, options);

	const outputDir = path.dirname(outputPath);
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true });
	}

	fs.writeFileSync(outputPath, ts);
};

export const processConfig = async (configPath: string): Promise<void> => {
	const config: BuildConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));

	for (const schemaConfig of config)
		await generateTypeScriptType(schemaConfig.input, schemaConfig.output);
};
