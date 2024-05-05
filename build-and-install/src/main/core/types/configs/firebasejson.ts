type FirebaseJSON_Hosting_Rewrites = {
	source: string;
	destination: string;
}

type FirebaseJSON_HostingSingle = {
	public: string;
	headers?: string[];
	rewrites: FirebaseJSON_Hosting_Rewrites[]
};

type FirebaseJSON_HostingMulti = FirebaseJSON_HostingSingle & {
	target: string;
};

export type FirebaseJSON = {
	hosting?: FirebaseJSON_HostingMulti[] | FirebaseJSON_HostingSingle;
	functions?: {
		source: string,
		ignore?: string[]
	};
};