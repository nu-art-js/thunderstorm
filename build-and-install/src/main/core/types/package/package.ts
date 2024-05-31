export const PackageType_InfraLib = 'infra-lib' as const;
export const PackageType_ProjectLib = 'project-lib' as const;
export const PackageType_FirebaseHostingApp = 'firebase-hosting-app' as const;
export const PackageType_FirebaseHostingAndFunctionApp = 'firebase-app' as const;
export const PackageType_FirebaseFunctionsApp = 'firebase-functions-app' as const;
export const PackageType_Sourceless = 'sourceless' as const;
export const PackageType_Python = 'python' as const;
export const PackageTypes = [PackageType_InfraLib, PackageType_ProjectLib, PackageType_FirebaseHostingApp, PackageType_FirebaseFunctionsApp, PackageType_Sourceless, PackageType_Python] as const;
export const PackageTypesWithOutput = [PackageType_InfraLib, PackageType_ProjectLib, PackageType_FirebaseHostingApp, PackageType_FirebaseFunctionsApp];
export type PackageType = typeof PackageTypes[number];

export type FirebaseEnvConfig<Env extends string> = {
	env: Env
	isLocal?: boolean
	projectId: string
	name: string
	backend: {
		url: string,
		minLogLevel?: 'Verbose' | 'Debug' | 'Info' | 'Warning' | 'Error',
		compress?: boolean
		timeout?: number
	}
	firebase: {
		listener?: {
			config: {
				apiKey: string
				authDomain: string
				databaseURL: string
				projectId: string
				storageBucket: string
				messagingSenderId: string
				appId: string
				measurementId: string
			}
		}
	}
}

export type FirebasePackageConfig<Env extends string = string> = {
	envs: FirebaseEnvConfig<Env>[];
	name: string

	debugPort: number,
	basePort: number,
	hostingPort?: number,
	pathToFirebaseConfig: string
	ssl?: {
		pathToKey: string
		pathToCertificate: string
	}
	functions?: {
		ignore: string[]
	},
	hosting?: {
		public: string
		rewrites: {
			source: string
			destination: string
		}[]
	}
}
export type Package_Base = {
	name: string
	path: string;
}

export type Package_Sourceless = Package_Base & {
	type: typeof PackageType_Sourceless;
};

export type Package_Python = Package_Base & {
	type: typeof PackageType_Python;
	path: string;
}

export type Package_WithSources = Package_Base & {
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
};

export type Package_FirebaseBase = Package_WithSources & {
	envConfig: FirebasePackageConfig
}

export type Package_FirebaseHostingApp = Package_FirebaseBase & {
	type: typeof PackageType_FirebaseHostingApp;
};

export type Package_FirebaseFunctionsApp = Package_FirebaseBase & {
	type: typeof PackageType_FirebaseFunctionsApp;
};

export type Package_FirebaseHostingAndFunctionApp = Package_FirebaseBase & {
	type: typeof PackageType_FirebaseHostingAndFunctionApp;
};

export type Package_InfraLib = Package_WithSources & {
	type: typeof PackageType_InfraLib;
}

export type Package_ProjectLib = Package_WithSources & {
	type: typeof PackageType_ProjectLib;
}

// export type PackageData = {
// 	PackageType_Sourceless: Package_Sourceless;
// 	PackageType_InfraLib: Package_InfraLib;
// 	PackageType_ProjectLib: Package_ProjectLib;
// 	PackageType_FirebaseHostingApp: Package_FirebaseHostingApp;
// 	PackageType_FirebaseFunctionsApp: Package_FirebaseFunctionsApp;
// }
//
// export type Package<K extends PackageType = PackageType> = {} & PackageData[K];

export type Package =
	Package_Sourceless
	| Package_FirebaseHostingApp
	| Package_FirebaseFunctionsApp
	| Package_InfraLib
	| Package_ProjectLib
	| Package_Python;

