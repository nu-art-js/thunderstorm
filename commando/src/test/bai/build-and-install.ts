import {mapProjectPackages} from './logic/map-project-packages';
import {_keys, convertToFullPath} from './core/tools';
import {ProjectManager} from './logic/ProjectManager';
import {JSONVersion, PackageJson} from './core/types';
import * as fs from 'fs';
import {promises as _fs} from 'fs';
import {Commando} from '../../main/core/cli';
import {Cli_Basic} from '../../main/cli/basic';
import {PNPM} from '../../main/cli/pnpm';
import {NVM} from '../../main/cli/nvm';


const CONST_ThunderstormVersionKey = 'THUNDERSTORM_SDK_VERSION';
const CONST_ProjectVersionKey = 'APP_VERSION';

const projectPackages = mapProjectPackages(convertToFullPath('./.config/packages.json'));
const projectManager = new ProjectManager(projectPackages);
let interactiveCommando!: Commando;
const runningWithThunderstormSources = true;

projectManager.registerPhqase({
	type: 'project',
	name: 'setup-project',
	action: async () => {
		if (runningWithThunderstormSources)
			await _fs.copyFile(convertToFullPath('./.config/pnpm-workspace.yaml'), convertToFullPath('./pnpm-workspace.yaml'));

		const thunderstormVersionJson = require(convertToFullPath('./version-thunderstorm.json')) as JSONVersion;
		projectPackages.params[CONST_ThunderstormVersionKey] = thunderstormVersionJson.version;

		const projectVersionJson = require(convertToFullPath('./version-app.json')) as JSONVersion;
		projectPackages.params[CONST_ProjectVersionKey] = projectVersionJson.version;
	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'setup-packages',
	action: async () => {

	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'install-nvm',
	action: async () => {
		await NVM.installRequiredVersionIfNeeded();
		interactiveCommando = NVM.createCommando().debug();
	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'install-pnpm',
	action: async () => {
		await PNPM.install(interactiveCommando);
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'resolve-template',
	action: async (pkg) => {
		let packageJsonTemplateAsString = JSON.stringify(pkg.packageJsonTemplate);
		let match = null;
		do {
			match = packageJsonTemplateAsString.match(/\$([A-Z_]+)/);
			if (match?.[0])
				packageJsonTemplateAsString = packageJsonTemplateAsString.replace(new RegExp(`\\$${match[1]}`, 'g'), projectPackages.params[match[1]]);
		} while (!!match);

		const packageJson = JSON.parse(packageJsonTemplateAsString) as PackageJson;
		if (packageJson.dependencies)
			_keys(packageJson.dependencies).reduce((dependencies, dependencyKey) => {
				if (dependencies[dependencyKey] === '$$') {
					const packageDetails = projectPackages.packageMap[dependencies[dependencyKey]];
					if (!packageDetails)
						throw new Error('$$ can only be used with inner project dependency');

					dependencies[dependencyKey] = packageDetails.packageJsonTemplate.version;
				}

				return dependencies;
			}, packageJson.dependencies);

		pkg.packageJson = packageJson;
	}
});

projectManager.registerPhase({
	type: 'package',
	name: 'package-purge',
	action: async (pkg) => {
		if (fs.existsSync(pkg.output))
			await _fs.rm(pkg.output, {recursive: true, force: true});

		if (fs.existsSync(pkg.nodeModulesFolder))
			await _fs.rm(pkg.nodeModulesFolder, {recursive: true, force: true});
	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'install',
	action: async () => {
		await PNPM.installPackages(interactiveCommando);
	}
});

projectManager.registerPhase({
	type: 'project',
	name: 'debug',
	action: async () => {
		console.log(JSON.stringify(projectPackages, null, 2));
	}
});

(async () => {
	return projectManager.execute();
	// return projectManager.runPhaseByKey('install-pnpm');
	// return projectManager.runPhaseByKey('install-nvm');
})()
	.then(() => console.log('completed'))
	.catch(err => console.error('Failed with error: ', err));
