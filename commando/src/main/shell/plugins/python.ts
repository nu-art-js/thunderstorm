import {BaseCommando} from '../core/BaseCommando';
import {Commando_Programming} from './programming';
import {MergeClass} from '../core/class-merger';
import {Commando_Basic} from './basic';
import {Exception} from '@thunder-storm/common';


const Super = MergeClass(BaseCommando, Commando_Programming, Commando_Basic);

const DefaultVenvFolder = '.venv';

export class Commando_Python3
	extends Super {

	sourceVenv(venvFolder = DefaultVenvFolder): this {
		this.append(`source ${venvFolder}/bin/activate`);

		return this;
	}

	async installVenv(venvFolder = DefaultVenvFolder) {
		this.append(`python3 -m venv ${venvFolder}`);
		await this.execute((stdout, stderr, exitCode) => {
			if (exitCode !== 0)
				throw new Exception(`Error installing VENV - exit code (${exitCode})`);
		});
		return this;
	}

	async installRequirements(pathToRequirementsFile: string = './requirements.txt') {
		await this.append(`pip3 install -r ${pathToRequirementsFile}`)
			.execute();

		return this;
	}
}