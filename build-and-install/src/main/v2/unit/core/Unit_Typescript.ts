import {BaseUnit} from './BaseUnit';
import {Phase_CopyPackageJSON, UnitPhaseImplementor} from './types';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {CONST_PackageJSONTemplate, MemKey_Packages} from '../../../core/consts';
import {PackageJson} from '../../../core/types';
import {BadImplementationException, ImplementationMissingException} from '@nu-art/ts-common';
import {convertPackageJSONTemplateToPackJSON_Value} from '../../../logic/map-project-packages';
import * as fs from 'fs';
import {promises as _fs} from 'fs';

const PackageJsonTargetKey_Root = 'root';
const PackageJsonTargetKey_Dist = 'dist';
const PackageJsonTargetKey_Dependency = 'dependency';
const PackageJsonTargetKeys = [PackageJsonTargetKey_Root,PackageJsonTargetKey_Dist,PackageJsonTargetKey_Dependency] as const;
type PackageJsonTargetKey = typeof PackageJsonTargetKeys[number];

type _Config<Config> = {
	pathToPackage: string
} & Config

export class Unit_Typescript<Config extends {} = {}, C extends _Config<Config> = _Config<Config>>
	extends BaseUnit<C>
	implements UnitPhaseImplementor<[Phase_CopyPackageJSON]> {

	readonly packageJson: {[k in PackageJsonTargetKey]:PackageJson} = {} as {[k in PackageJsonTargetKey]:PackageJson};

	//######################### Internal Logic #########################

	/**
	 * Create a packageJson object for each target key
	 * @private
	 */
	private async populatePackageJson () {
		const unitRootPath = convertToFullPath(this.config.pathToPackage);
		const templatePath = `${unitRootPath}/${CONST_PackageJSONTemplate}`;

		if(!fs.existsSync(templatePath))
			throw new BadImplementationException(`Missing __package.json file in root for unit ${this.config.label}`);

		const template = JSON.parse(await _fs.readFile(templatePath, 'utf-8')) as PackageJson;

		PackageJsonTargetKeys.forEach(key => this.packageJson[key] = this.convertTemplatePackageJSON(key,template))
	}

	/**
	 * Execute template to packageJson object conversion based on target key
	 * @param targetKey
	 * @param template
	 * @private
	 */
	private convertTemplatePackageJSON(targetKey: PackageJsonTargetKey, template: PackageJson) {
		switch (targetKey) {
			case PackageJsonTargetKey_Root:
				return this.convertPJForRoot(template);
			case PackageJsonTargetKey_Dist:
				return this.convertPJForDist(template);
			case PackageJsonTargetKey_Dependency:
				return this.convertPJForDependency(template);
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
		const params = MemKey_Packages.get()?.params ?? {};

		//Convert template to actual package.json
		return convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => params[key!] ? 'workspace:*' : params[value]);
	}

	/**
	 * Converts a template __package.json file into a usable package.json for the unit dist
	 * @param template
	 * @private
	 */
	private convertPJForDist(template: PackageJson) {
		//Get the package params for replacing in the template package json
		const params = MemKey_Packages.get()?.params ?? {};
		const converted = this.packageJson[PackageJsonTargetKey_Root] ?? this.convertPJForRoot(template);

		params[converted.name] = converted.version;
		params[`${converted.name}_path`] = `file:.dependencies/${this.config.key}`; //Not sure about this one

		//Convert template to actual package.json
		return convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => params[key!] ?? params[value]);
	}

	/**
	 * Converts a template __package.json file into a usable package.json for the unit
	 * as it will be in a .dependencies of a deployable unit
	 * @param template
	 * @private
	 */
	private convertPJForDependency(template: PackageJson) {
		//Get the package params for replacing in the template package json
		const params = MemKey_Packages.get()?.params ?? {};
		const converted = this.packageJson[PackageJsonTargetKey_Root] ?? this.convertPJForRoot(template);

		params[converted.name] = converted.version;
		params[`${converted.name}_path`] = `file:.dependencies/${this.config.key}`; //Not sure about this one

		//Convert template to actual package.json
		return convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => params[key!] ?? params[value]);
	}

	//######################### Phase Implementations #########################

	async copyPackageJson() {
		//Populate packageJson objects
		await this.populatePackageJson();
		//Get path
		const unitRootPath = convertToFullPath(this.config.pathToPackage);
		//Create the package.json file in target location
		await _fs.writeFile(unitRootPath, JSON.stringify(this.packageJson.root, null, 2), {encoding: 'utf-8'});
	}
}
