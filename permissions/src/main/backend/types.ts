export type DefaultDef_Api = { path: string, accessLevels: { domainName: string, levelName: string }[] };

export type DefaultDef_Project = {
	name: string,
	apis: DefaultDef_Api[],
	groups:DefaultDef_Group[]
	domains: {
		namespace: string,
		levels: { name: string, value: number }[]
	}[]
}
export type DefaultDef_Setup = {
	projects: DefaultDef_Project[];
};
export type DefaultDef_Group = {
	name:string
	accessLevels: {[domainName:string]: string} // access level name
};