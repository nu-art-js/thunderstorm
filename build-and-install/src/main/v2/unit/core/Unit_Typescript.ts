import {BaseUnit} from './BaseUnit';
import {Phase_CopyPackageJSON, UnitPhaseImplementor} from './types';
import {convertToFullPath} from '@nu-art/commando/core/tools';
import {CONST_PackageJSON, CONST_PackageJSONTemplate, MemKey_Packages} from '../../../core/consts';
import {PackageJson} from '../../../core/types';
import {ImplementationMissingException} from '@nu-art/ts-common';
import {convertPackageJSONTemplateToPackJSON_Value} from '../../../logic/map-project-packages';
import {promises as _fs} from 'fs';

type PackageJSONTargetKey = 'root' | 'dist' | 'dependency';

const targetKeyPathMap: {[k in PackageJSONTargetKey]:string} = {
	'root':'',
	'dist':'/dist',
	'dependency':'', //TODO: Fill this in
}

type _Config<Config> = {
	pathToPackage: string
} & Config

export class Unit_Typescript<Config extends {} = {}, C extends _Config<Config> = _Config<Config>>
	extends BaseUnit<C>
	implements UnitPhaseImplementor<[Phase_CopyPackageJSON]> {

	//######################### Internal Logic #########################

	private convertTemplatePackageJSON(targetKey: PackageJSONTargetKey, template: PackageJson) {
		switch (targetKey) {
			case 'root':
				return this.convertPJForRoot(template);
			case 'dist':
				return this.convertPJForDist(template);
			case 'dependency':
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
		const converted = this.convertPJForRoot(template);

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
		const converted = this.convertPJForRoot(template);

		params[converted.name] = converted.version;
		params[`${converted.name}_path`] = `file:.dependencies/${this.config.key}`; //Not sure about this one

		//Convert template to actual package.json
		return convertPackageJSONTemplateToPackJSON_Value(template, (value: string, key?: string) => params[key!] ?? params[value]);
	}

	//######################### Phase Implementations #########################

	async copyPackageJson(targetKey: PackageJSONTargetKey = 'root') {
		//Find paths
		const unitRootPath = convertToFullPath(this.config.pathToPackage);
		const templatePath = `${unitRootPath}/${CONST_PackageJSONTemplate}`;
		const targetPath = `${unitRootPath + targetKeyPathMap[targetKey]}/${CONST_PackageJSON}`;

		//Get the template __package.json file
		const template = JSON.parse(await _fs.readFile(templatePath, 'utf-8')) as PackageJson;

		//Get converted package.json content
		const packageJSON = this.convertTemplatePackageJSON(targetKey,template);

		//Create the package.json file in target location
		await _fs.writeFile(targetPath, JSON.stringify(packageJSON, null, 2), {encoding: 'utf-8'});
	}
}
