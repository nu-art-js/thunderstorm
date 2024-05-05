export const PackageType_InfraLib = 'infra-lib' as const;
export const PackageType_ProjectLib = 'project-lib' as const;
export const PackageType_FirebaseHostingApp = 'firebase-hosting-app' as const;
export const PackageType_FirebaseFunctionsApp = 'firebase-functions-app' as const;
export const PackageType_Sourceless = 'sourceless' as const;
export const PackageTypes = [PackageType_InfraLib, PackageType_ProjectLib, PackageType_FirebaseHostingApp, PackageType_FirebaseFunctionsApp, PackageType_Sourceless] as const;
export const PackageTypesWithOutput = [PackageType_InfraLib, PackageType_ProjectLib, PackageType_FirebaseHostingApp, PackageType_FirebaseFunctionsApp];
export type PackageType = typeof PackageTypes[number];

export type FirebasePackageConfig<Env extends string = string> = {
	envs: Env[]
	projectIds: {
		[env in Env]: string
	}
	debugPort: number,
	basePort: number,
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

export type Package_FirebaseHostingApp = Package_Base & {
	type: typeof PackageType_FirebaseHostingApp;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
	envConfig: FirebasePackageConfig
};

export type Package_FirebaseFunctionsApp = Package_Base & {
	type: typeof PackageType_FirebaseFunctionsApp;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
	envConfig: FirebasePackageConfig
};

export type Package_InfraLib = Package_Base & {
	type: typeof PackageType_InfraLib;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
}

export type Package_ProjectLib = Package_Base & {
	type: typeof PackageType_ProjectLib;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
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