import {BaseCommando} from '../core/BaseCommando.js';
import {Commando_Programming} from './programming.js';
import {MergeClass} from '../core/class-merger.js';
import {Commando_Basic} from './basic.js';
import {Exception} from '@nu-art/ts-common';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic);

/** Default virtual environment folder name */
const DefaultVenvFolder = '.venv';

/**
 * Python 3 plugin for Commando.
 *
 * Provides Python virtual environment operations:
 * - Create virtual environments
 * - Activate virtual environments
 * - Install requirements from requirements.txt
 *
 * Extends Commando_Programming and Commando_Basic (merged).
 */
export class Commando_Python3
	extends Super {

	/**
	 * Activates a Python virtual environment.
	 *
	 * Sources the activation script for the virtual environment.
	 *
	 * @param venvFolder - Virtual environment folder path (default: '.venv')
	 * @returns This instance for method chaining
	 */
	sourceVenv(venvFolder = DefaultVenvFolder): this {
		this.append(`source ${venvFolder}/bin/activate`);

		return this;
	}

	/**
	 * Creates a Python virtual environment.
	 *
	 * @param venvFolder - Virtual environment folder path (default: '.venv')
	 * @returns This instance for method chaining
	 * @throws Exception if virtual environment creation fails
	 */
	async installVenv(venvFolder = DefaultVenvFolder) {
		this.append(`python3 -m venv ${venvFolder}`);
		await this.execute((stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new Exception(`Error installing VENV - exit code (${exitCode})`);
		});
		return this;
	}

	/**
	 * Installs Python packages from a requirements file.
	 *
	 * @param pathToRequirementsFile - Path to requirements.txt file (default: './requirements.txt')
	 * @returns This instance for method chaining
	 */
	async installRequirements(pathToRequirementsFile: string = './requirements.txt') {
		await this.append(`pip3 install -r ${pathToRequirementsFile}`)
			.execute();

		return this;
	}
}