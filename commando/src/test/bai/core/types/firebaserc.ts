type TargetProject = {
	hosting?: {
		[siteName: string]: string[];
	};
}

export type FirebaseRC = {
	projects: { default?: string } & { [key: string]: string }
	targets?: {
		[project: string]: TargetProject;
	}
}

