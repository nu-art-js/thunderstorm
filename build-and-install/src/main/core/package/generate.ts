import {FirebaseEnvConfig, Package_FirebaseFunctionsApp, Package_FirebaseHostingAndFunctionApp, Package_FirebaseHostingApp} from '../types';
import {BadImplementationException} from '@nu-art/ts-common';
import {promises as _fs} from 'fs';
import {CONST_FirebaseJSON} from '../consts';
import {MemKey_DefaultFiles} from '../../defaults/consts';
import {RuntimeParams} from '../params/params';


export function createFirebaseHostingConfig<Env extends string>(pkg: Package_FirebaseHostingApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	return {
		projects: {
			default: envConfig.projectId,
		}
	};
}

export function createFirebaseFunctionConfig<Env extends string>(pkg: Package_FirebaseHostingApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	return;
}

export function createFirebaseRC<Env extends string>(pkg: Package_FirebaseHostingApp | Package_FirebaseFunctionsApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	return {
		projects: {
			default: envConfig.projectId,
		}
	};
}

function getHostingConfig(pkg: Package_FirebaseHostingApp | Package_FirebaseHostingAndFunctionApp, envConfig: FirebaseEnvConfig<string>) {
	if (envConfig.isLocal)
		return {};

	return {
		hosting: pkg.envConfig.hosting
	};
}

export async function writeToFile_HostingFirebaseJSON<Env extends string>(pkg: Package_FirebaseHostingApp | Package_FirebaseHostingAndFunctionApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	const fileContent = getHostingConfig(pkg, envConfig);
	await _fs.writeFile(`${pkg.path}/${CONST_FirebaseJSON}`, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
}

export async function writeToFile_HostingFirebaseConfigJSON<Env extends string>(pkg: Package_FirebaseHostingApp | Package_FirebaseHostingAndFunctionApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	const emulatorConfig = {
		hostname: 'localhost',
		port: pkg.envConfig.basePort + 2,
	};

	const feConfig = {
		ModuleFE_Thunderstorm: {
			appName: `${pkg.name} - (${env})`
		},
		ModuleFE_XHR: {
			origin: envConfig.isLocal ? `https://localhost:${pkg.envConfig.basePort}` : envConfig.backend.url,
			timeout: envConfig.backend.timeout || 30000,
			compress: envConfig.backend.compress || false,
			minLogLevel: envConfig.backend.minLogLevel || false,
		},
		ModuleFE_FirebaseListener: {
			emulatorConfig: envConfig.isLocal ? emulatorConfig : undefined,
			firebaseConfig: envConfig.firebase.listener?.config
		}
	};

	const fileContent = `export const config = ${JSON.stringify(feConfig, null, 2)};`;
	await _fs.writeFile(`${pkg.path}/src/main/config.ts`, fileContent, {encoding: 'utf-8'});
}

export async function writeToFile_functionFirebaseConfigJSON<Env extends string>(pkg: Package_FirebaseFunctionsApp | Package_FirebaseHostingAndFunctionApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	const beConfig = {
		name: envConfig.env
	};

	const fileContent = `${envConfig.isLocal ? '// @ts-ignore\nprocess.env[\'NODE_TLS_REJECT_UNAUTHORIZED\'] = 0;\n' : ''}
export const Environment = ${JSON.stringify(beConfig)};`;
	await _fs.writeFile(`${pkg.path}/src/main/config.ts`, fileContent, {encoding: 'utf-8'});
}

function getFunctionConfig(pkg: Package_FirebaseFunctionsApp | Package_FirebaseHostingAndFunctionApp, envConfig: FirebaseEnvConfig<string>) {
	if (envConfig.isLocal) {
		const port = pkg.envConfig.basePort;
		return {
			database: {
				rules: `${pkg.envConfig.pathToFirebaseConfig}/database.rules.json`
			},
			firestore: {
				rules: `${pkg.envConfig.pathToFirebaseConfig}/firestore.rules`,
				indexes: `${pkg.envConfig.pathToFirebaseConfig}/firestore.indexes.json`
			},
			storage: {
				rules: `${pkg.envConfig.pathToFirebaseConfig}/storage.rules`
			},
			remoteconfig: {
				template: `${pkg.envConfig.pathToFirebaseConfig}/remoteconfig.template.json`
			},
			functions: {
				ignore: pkg.envConfig.functions?.ignore,
				source: '.',
				predeploy: [
					'echo "Thunderstorm - Local environment is not deployable... Aborting..." && exit 2'
				]
			},
			emulators: {
				functions: {port: port + 1},
				database: {port: port + 2},
				firestore: {
					port: port + 3,
					websocketPort: port + 4
				},
				pubsub: {port: port + 5},
				storage: {port: port + 6},
				auth: {port: port + 7},
				ui: {port: port + 8, enabled: true},
				hub: {port: port + 9},
				logging: {port: port + 10}
			}
		};
	} else {
		return {
			functions: {
				source: pkg.output.replace(`${pkg.path}/`, ''),
				ignore: pkg.envConfig.functions?.ignore
			}
		};
	}
}

export async function writeToFile_FunctionFirebaseJSON<Env extends string>(pkg: Package_FirebaseFunctionsApp | Package_FirebaseHostingAndFunctionApp, env: Env) {
	const envConfig = getEnvConfig(pkg);
	const fileContent = getFunctionConfig(pkg, envConfig);
	await _fs.writeFile(`${pkg.path}/${CONST_FirebaseJSON}`, JSON.stringify(fileContent, null, 2), {encoding: 'utf-8'});
}

export function createFirebaseFullJSON<Env extends string>(pkg: Package_FirebaseHostingAndFunctionApp, env: Env) {
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`Could not find env: ${env}`);

	const hosting = writeToFile_HostingFirebaseJSON(pkg, env);
	const functions = writeToFile_FunctionFirebaseJSON(pkg, env);
	return {
		...hosting,
		...functions
	};
}

export function getEnvConfig(pkg: Package_FirebaseHostingApp | Package_FirebaseFunctionsApp | Package_FirebaseHostingAndFunctionApp) {
	const env = RuntimeParams.environment;
	const envConfig = pkg.envConfig.envs.find(_env => _env.env === env);
	if (!envConfig)
		throw new BadImplementationException(`No env config for env ${env} in package ${pkg.name}`);

	return envConfig;
}

export async function generateProxyFile(firebasePkg: Package_FirebaseHostingApp | Package_FirebaseFunctionsApp, pathToFile: string) {
	const envConfig = getEnvConfig(firebasePkg);
	const defaultFiles = MemKey_DefaultFiles.get();
	if(!defaultFiles?.backend?.proxy)
		return;

	let fileContent = await _fs.readFile(defaultFiles.backend.proxy, {encoding: 'utf-8'});
	fileContent = fileContent.replace(/PROJECT_ID/g, `${envConfig.projectId}`);
	fileContent = fileContent.replace(/PROXY_PORT/g, `${firebasePkg.envConfig.basePort}`);
	fileContent = fileContent.replace(/SERVER_PORT/g, `${firebasePkg.envConfig.basePort + 1}`);
	fileContent = fileContent.replace(/PATH_TO_SSL_KEY/g, `${firebasePkg.envConfig.ssl?.pathToKey}`);
	fileContent = fileContent.replace(/PATH_TO_SSL_CERTIFICATE/g, `${firebasePkg.envConfig.ssl?.pathToCertificate}`);
	await _fs.writeFile(pathToFile, fileContent, {encoding: 'utf-8'});
}
