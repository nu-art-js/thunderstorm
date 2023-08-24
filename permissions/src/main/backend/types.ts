export type DefaultDef_Api = { path: string, accessLevels: { [domainName: string]: string /* access level name */ } };

export type DefaultDef_Project = {
	_id: string
	name: string,
	apis: DefaultDef_Api[],
	groups: DefaultDef_Group[]
	domains: {
		_id: string
		namespace: string,
		levels: DefaultDef_AccessLevel[]
	}[]
}
export type DefaultDef_Setup = {
	projects: DefaultDef_Project[];
};

export type DefaultDef_AccessLevel = {
	_id: string
	name: string
	value: number
}

export type DefaultDef_Group = {
	_id: string
	name: string
	accessLevels: { [domainName: string]: string } // access level name
};