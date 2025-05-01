import {CONST_PackageJSON, CONST_PackageJSONTemplate} from '../../core/consts';
import {PackageJson} from '../../core/types';
import {__stringify, BadImplementationException, ImplementationMissingException} from '@nu-art/ts-common';
import * as fs from 'fs';
import {copyFileSync, existsSync, promises as _fs, readdirSync, statSync} from 'fs';
import {Phase_CopyPackageJSON} from '../../phase';
import {UnitPhaseImplementor} from '../../types/types';
import {MemKey_ProjectConfig} from '../../v2/phase-runner/RunnerParams';
import {convertPackageJSONTemplateToPackJSON_Value} from '../../v2/unit/tools/tools';
import {Config_ProjectUnit, ProjectUnit} from './ProjectUnit';
import {resolve} from 'path';


const PackageJsonTargetKey_Template = 'template';
const PackageJsonTargetKey_Root = 'root';
const PackageJsonTargetKey_Dist = 'dist';
const PackageJsonTargetKeys = [PackageJsonTargetKey_Template, PackageJsonTargetKey_Root, PackageJsonTargetKey_Dist] as const;
type PackageJsonTargetKey = typeof PackageJsonTargetKeys[number];

export type Unit_Typescript_Config = Config_ProjectUnit & {
	customESLintConfig: boolean;
};


export class Unit_NodePackage<C extends Unit_Typescript_Config = Unit_Typescript_Config>
	extends ProjectUnit<C>
	implements UnitPhaseImplementor<[Phase_CopyPackageJSON]> {

	readonly packageJson: { [k in PackageJsonTargetKey]: PackageJson } = {} as { [k in PackageJsonTargetKey]: PackageJson };

	constructor(config: C) {
		super(config);
		this.addToClassStack(Unit_NodePackage);
	}

	protected async init(setInitialized: boolean = true) {
		await super.init(false);
		await this.loadTemplatePackageJSON();
		if (setInitialized)
			this.setStatus('Initialized');
	}

	//######################### Internal Logic #########################

	private async loadTemplatePackageJSON() {
		const unitRootPath = this.config.fullPath;
		const templatePath = `${unitRootPath}/${CONST_PackageJSONTemplate}`;

		if (!fs.existsSync(templatePath))
			throw new BadImplementationException(`Missing __package.json file in root for unit ${this.config.label}`);

		try {
			this.packageJson.template = JSON.parse(await _fs.readFile(templatePath, 'utf-8')) as PackageJson;
		} catch (e: any) {
			throw new BadImplementationException(`There is an issue in the __package.json file in root for unit ${this.config.label}`);
		}
	}

	/**
	 * Create a packageJson object for each target key
	 * @private
	 */
	private async populatePackageJson() {
		if (!this.packageJson.template)
			throw new BadImplementationException(`Missing template package.json for unit ${this.config.label}`);

		PackageJsonTargetKeys.forEach(key => this.packageJson[key] = this.convertTemplatePackageJSON(key, this.packageJson.template));
	}

	/**
	 * Execute template to packageJson object conversion based on target key
	 * @param targetKey
	 * @param template
	 * @private
	 */
	private convertTemplatePackageJSON(targetKey: PackageJsonTargetKey, template: PackageJson) {
		switch (targetKey) {
			case PackageJsonTargetKey_Template:
				return template;
			case PackageJsonTargetKey_Root:
				return this.convertPJForRoot(template);
			case PackageJsonTargetKey_Dist:
				return this.convertPJForDist(template);
			default:
				throw new ImplementationMissingException(`No implementation for targetKey ${targetKey}`);
		}
	}

	/**
	 * Converts a template __package.json file into a usable package.json for the unit root
	 * @param template
	 * @private
	 */
	private convertPJForRoot(template: PackageJson) {
		//Get the package params for replacing in the template package json
		const projectConfig = MemKey_ProjectConfig.get();

		//Convert template to actual package.json
		const converted = convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => projectConfig.params[key!]
			? 'workspace:*'
			: projectConfig.params[value]);

		//Set dynamic params for this pkg
		projectConfig.params[converted.name] = converted.version;
		projectConfig.params[`${converted.name}_path`] = `file:.dependencies/${this.config.key}`; //Not sure about this one

		MemKey_ProjectConfig.set(projectConfig);
		return converted;
	}

	/**
	 * Converts a template __package.json file into a usable package.json for the unit dist
	 * @param template
	 * @private
	 */
	private convertPJForDist(template: PackageJson) {
		//Get the package params for replacing in the template package json
		const params = MemKey_ProjectConfig.get().params;

		//if main prop exists on pkg json clear the dist from its ref
		if (template.main)
			template.main = template.main.replace('dist/', '');

		//if types prop exists on pkg json clear the dist from its ref
		if (template.types)
			template.types = template.types.replace('dist/', '');

		//Convert template to actual package.json
		return convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => params[key!] ?? params[value]);
	}

	//######################### Phase Implementations #########################

	async copyPackageJson() {
		this.setStatus('Resolving PackageJSON');
		//Populate packageJson objects
		await this.populatePackageJson();
		//Get path
		const unitRootPath = this.config.fullPath;
		const targetPath = `${unitRootPath}/${CONST_PackageJSON}`;
		//Create the package.json file in target location
		await _fs.writeFile(targetPath, JSON.stringify(this.packageJson.root, null, 2), {encoding: 'utf-8'});
		this.setStatus('PackageJSON resolved');
	}


	/**
	 * Prepares the workspace for this project unit.
	 * Ensures tsconfig.json files exist in the proper source folders,
	 * and copies .eslintrc.json if necessary, handling fallback scenarios cleanly.
	 */
	async prepare(params: { baiDefaultsPath: string; projectRoot: string; }) {
		const {baiDefaultsPath, projectRoot} = params;

		this.logDebug(`Preparing workspace for unit: ${this.config.key}`);
		this.logVerbose(`Parameters: baiDefaultsPath=${baiDefaultsPath}, projectRoot=${projectRoot}`);

		// Handle source folder tsconfig setup
		const srcFolder = resolve(this.config.fullPath, 'src');
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
			if (this.config.customESLintConfig) {
				if (!existsSync(tsConfigPath))
					throw new BadImplementationException(`Expected custom tsconfig in folder for source folder: ${entryPath}\n${__stringify({
						unit: this.config.key,
						sourceFolder: entry,
					})}`);

				this.logVerbose(`tsconfig.json already exists for source: ${entry}, skipping copy.`);
				continue;
			}

			const defaultTsConfigTemplate = resolve(baiDefaultsPath, `tsconfig-${entry}.json`);
			const projectDefaultTsConfig = resolve(projectRoot, 'defaults', 'tsconfig.json');

			if (existsSync(projectDefaultTsConfig)) {
				this.logDebug(`Copying project-level default tsconfig for source: ${entry}`);
				copyFileSync(projectDefaultTsConfig, tsConfigPath);
				continue;
			}

			if (existsSync(defaultTsConfigTemplate)) {
				this.logDebug(`Copying default tsconfig for source: ${entry}`);
				copyFileSync(defaultTsConfigTemplate, tsConfigPath);
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
		if (this.config.customESLintConfig)
			return;

		const eslintConfigPath = resolve(this.config.fullPath, '.eslintrc.json');
		if (existsSync(eslintConfigPath))
			return;

		const defaultEslint = resolve(baiDefaultsPath, '.eslintrc.json');
		if (!existsSync(defaultEslint)) {
			this.logError(`Missing default eslint configuration at path: ${defaultEslint}`);
			throw new BadImplementationException(`Missing default eslint configuration at ${defaultEslint}\n${__stringify({
				unit: this.config.key,
				defaultPath: defaultEslint
			})}`,);
		}

		this.logDebug(`Copying default eslint configuration for unit: ${this.config.key}`);
		copyFileSync(defaultEslint, eslintConfigPath);
	}

}