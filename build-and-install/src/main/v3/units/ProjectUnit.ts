import {StringMap, BadImplementationException, ImplementationMissingException, __stringify} from '@nu-art/ts-common';
import {BaseUnit, BaseUnit_Config} from './BaseUnit';
import {existsSync, copyFileSync, readdirSync, statSync} from 'fs';
import {resolve} from 'path';


export type ProjectDependency = {
	key: string;
	version: string;
}

export type Config_ProjectUnit = BaseUnit_Config & {
	relativePath: string;
	fullPath: string;
	dependencies: StringMap;
}

export type RuntimeConfig_ProjectUnit = {}


/**
 * Abstract class representing a Unit within a Project.
 * Extends the BaseUnit to provide additional project-specific preparation logic.
 */
export abstract class ProjectUnit<C extends Config_ProjectUnit = Config_ProjectUnit>
	extends BaseUnit<C> {

	constructor(config: C) {
		super(config);
		this.addToClassStack(ProjectUnit);
	}

	/**
	 * Prepares the workspace for this project unit.
	 * Ensures tsconfig.json files exist in the proper source folders,
	 * and copies .eslintrc.json if necessary, handling fallback scenarios cleanly.
	 */
	async prepare(params: { baiDefaultsPath: string; projectRoot: string; unitRoot: string; }) {
		const {baiDefaultsPath, projectRoot, unitRoot} = params;

		this.logDebug(`Preparing workspace for unit: ${this.config.key}`);
		this.logVerbose(`Parameters: baiDefaultsPath=${baiDefaultsPath}, projectRoot=${projectRoot}, unitRoot=${unitRoot}`);

		// Handle source folder tsconfig setup
		const srcFolder = resolve(unitRoot, 'src');
		if (!existsSync(srcFolder))
			return;

		const entries = readdirSync(srcFolder);
		for (const entry of entries) {
			const entryPath = resolve(srcFolder, entry);
			if (!statSync(entryPath).isDirectory()) {
				this.logError(`Unexpected non-directory entry in src/: ${entry}`);
				throw new BadImplementationException(`Non-directory entry under src folder\n ${__stringify({
					unit: this.config.key,
					invalidEntry: entry
				})}`);
			}

			const tsConfigPath = resolve(entryPath, 'tsconfig.json');
			if (existsSync(tsConfigPath)) {
				this.logVerbose(`tsconfig.json already exists for source: ${entry}, skipping copy.`);
				continue;
			}

			const defaultTsConfigTemplate = resolve(baiDefaultsPath, `tsconfig-${entry}.json`);
			const projectDefaultTsConfig = resolve(projectRoot, 'defaults', 'tsconfig.json');

			if (existsSync(defaultTsConfigTemplate)) {
				this.logDebug(`Copying default tsconfig for source: ${entry}`);
				copyFileSync(defaultTsConfigTemplate, tsConfigPath);
				continue;
			}

			if (existsSync(projectDefaultTsConfig)) {
				this.logDebug(`Copying project-level default tsconfig for source: ${entry}`);
				copyFileSync(projectDefaultTsConfig, tsConfigPath);
				continue;
			}

			this.logError(`Missing tsconfig templates for source folder: ${entry}`);
			throw new ImplementationMissingException(`Missing tsconfig template for source folder: ${entry}\n${__stringify({
				unit: this.config.key,
				sourceFolder: entry,
				checkedPaths: [defaultTsConfigTemplate, projectDefaultTsConfig]
			})}`);
		}

		// Handle ESLint config setup
		if (this.config.manageEslintConfig)
			return;

		const eslintConfigPath = resolve(unitRoot, '.eslintrc.json');
		if (existsSync(eslintConfigPath))
			return;

		const defaultEslint = resolve(baiDefaultsPath, '.eslintrc.json');
		if (!existsSync(defaultEslint)) {
			this.logError(`Missing default eslint configuration at path: ${defaultEslint}`);
			throw new BadImplementationException(`Missing default eslint configuration at ${defaultEslint}`, {
				unit: this.config.key,
				defaultPath: defaultEslint
			});
		}

		this.logDebug(`Copying default eslint configuration for unit: ${this.config.key}`);
		copyFileSync(defaultEslint, eslintConfigPath);
	}
}
