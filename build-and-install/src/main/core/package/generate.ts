import {Package_FirebaseFunctionsApp, Package_FirebaseHostingApp} from '../types';


export function createFirebaseRC<Env extends string>(pkg: Package_FirebaseHostingApp | Package_FirebaseFunctionsApp, env: Env) {
	return {
		projects: {
			default: pkg.envConfig.projectIds[env],
		}
	};
}

export function createFirebaseHostingJSON<Env extends string>(pkg: Package_FirebaseHostingApp, env: Env) {
	if (env === 'local')
		return {};

	return {
		hosting: pkg.envConfig.hosting
	};
}

export function createFirebaseFunctionsJSON<Env extends string>(pkg: Package_FirebaseFunctionsApp, env: Env) {
	if (env === 'local') {
		let port = pkg.envConfig.basePort;
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
				functions: {port: port++},
				database: {port: port++},
				firestore: {
					port: port++,
					websocketPort: port++
				},
				pubsub: {port: port++},
				storage: {port: port++},
				auth: {port: port++},
				ui: {port: port++, enabled: true},
				hub: {port: port++},
				logging: {port: port++}
			}
		};
	}

	return {
		functions: {
			source: pkg.output.replace(`${pkg.path}/`, ''),
			ignore: pkg.envConfig.functions?.ignore
		}
	};
}

export function createFirebaseFullJSON<Env extends string>(pkg: Package_FirebaseFunctionsApp & Package_FirebaseHostingApp, env: Env) {
	const hosting = createFirebaseHostingJSON(pkg, env);
	const functions = createFirebaseFunctionsJSON(pkg, env);
	return {
		...hosting,
		...functions
	};
}
