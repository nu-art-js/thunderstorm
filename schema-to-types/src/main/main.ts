import {processConfig} from "./schema-to-types";

export const getConfigArg = (): string | undefined => {
	const configArgPrefix = '--config=';
	const configArg = process.argv.find(arg => arg.startsWith(configArgPrefix));

	if (!configArg) {
		return
	}

	return configArg.substring(configArgPrefix.length);
}

const main = async () => {
	const configPath = getConfigArg();

	if (!configPath) {
		console.log("Usage: ts-node generate-types.ts --config=<config-file-path>");
		process.exit(1);
	}

	await processConfig(configPath).catch(console.error);
};

main();