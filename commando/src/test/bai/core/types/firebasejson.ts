type FirebaseJSON_Hosting_Rewrites = {
	source: string;
	destination: string;
}

type FirebaseJSON_Hosting = {
	public: string;
	target: string;
	headers?: string[];
	rewrites: FirebaseJSON_Hosting_Rewrites[]
};

export type FirebaseJSON = {
	hosting?: FirebaseJSON_Hosting[];
	ignore?: string[];
};