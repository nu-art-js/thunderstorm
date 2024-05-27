import {BaseUnit, Unit_TypescriptLib} from './core';
import {RuntimeParams} from '../../core/params/params';

export const Unit_TSCommon = new Unit_TypescriptLib({
	key: 'ts-common',
	label: 'TS/ts-common',
	pathToPackage: '_thunderstorm/ts-common',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_TSStyles = new Unit_TypescriptLib({
	key: 'ts-styles',
	label: 'TS/ts-styles',
	pathToPackage: '_thunderstorm/ts-styles',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_GoogleServices = new Unit_TypescriptLib({
	key: 'google-services',
	label: 'TS/google-services',
	pathToPackage: '_thunderstorm/google-services',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Commando = new Unit_TypescriptLib({
	key: 'commando',
	label: 'TS/commando',
	pathToPackage: '_thunderstorm/commando',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_BAI = new Unit_TypescriptLib({
	key: 'build-and-install',
	label: 'TS/build-and-install',
	pathToPackage: '_thunderstorm/build-and-install',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Firebase = new Unit_TypescriptLib({
	key: 'firebase',
	label: 'TS/firebase',
	pathToPackage: '_thunderstorm/firebase',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Thunderstorm = new Unit_TypescriptLib({
	key: 'thunderstorm',
	label: 'TS/thunderstorm',
	pathToPackage: '_thunderstorm/thunderstorm',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_TSPDF = new Unit_TypescriptLib({
	key: 'ts-pdf',
	label: 'TS/ts-pdf',
	pathToPackage: '_thunderstorm/ts-pdf',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Slack = new Unit_TypescriptLib({
	key: 'slack',
	label: 'TS/slack',
	pathToPackage: '_thunderstorm/slack',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_LiveDocs = new Unit_TypescriptLib({
	key: 'live-docs',
	label: 'TS/live-docs',
	pathToPackage: '_thunderstorm/live-docs',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_UserAccount = new Unit_TypescriptLib({
	key: 'user-account',
	label: 'TS/user-account',
	pathToPackage: '_thunderstorm/user-account',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Permissions = new Unit_TypescriptLib({
	key: 'permissions',
	label: 'TS/permissions',
	pathToPackage: '_thunderstorm/permissions',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_TSShortUrl = new Unit_TypescriptLib({
	key: 'ts-short-url',
	label: 'TS/short-url',
	pathToPackage: '_thunderstorm/ts-short-url',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_DependencyViewer = new Unit_TypescriptLib({
	key: 'ts-dependency-viewer',
	label: 'TS/dependency-viewer',
	pathToPackage: '_thunderstorm/ts-dependency-viewer',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_FocusedObject = new Unit_TypescriptLib({
	key: 'ts-focused-object',
	label: 'TS/focused-object',
	pathToPackage: '_thunderstorm/ts-focused-object',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Messaging = new Unit_TypescriptLib({
	key: 'ts-messaging',
	label: 'TS/messaging',
	pathToPackage: '_thunderstorm/ts-messaging',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Workspace = new Unit_TypescriptLib({
	key: 'ts-workspace',
	label: 'TS/workspace',
	pathToPackage: '_thunderstorm/ts-workspace',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_PushPubSub = new Unit_TypescriptLib({
	key: 'push-pub-sub',
	label: 'TS/push-pub-sub',
	pathToPackage: '_thunderstorm/push-pub-sub',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Jira = new Unit_TypescriptLib({
	key: 'jira',
	label: 'TS/jira',
	pathToPackage: '_thunderstorm/jira',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_BugReport = new Unit_TypescriptLib({
	key: 'bug-report',
	label: 'TS/bug-report',
	pathToPackage: '_thunderstorm/bug-report',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_Github = new Unit_TypescriptLib({
	key: 'github',
	label: 'TS/github',
	pathToPackage: '_thunderstorm/github',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_FileUpload = new Unit_TypescriptLib({
	key: 'file-upload',
	label: 'TS/file-upload',
	pathToPackage: '_thunderstorm/file-upload',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_TSOpenAI = new Unit_TypescriptLib({
	key: 'ts-openai',
	label: 'TS/openai',
	pathToPackage: '_thunderstorm/ts-openai',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const Unit_SchemaToTypes = new Unit_TypescriptLib({
	key: 'schema-to-types',
	label: 'TS/schema-to-types',
	pathToPackage: '_thunderstorm/schema-to-types',
	output: 'dist',
	filter: () => RuntimeParams.runWithThunderstorm,
});

export const allTSUnits: BaseUnit[] = [
	Unit_TSCommon,
	Unit_TSStyles,
	Unit_GoogleServices,
	Unit_Commando,
	Unit_BAI,
	Unit_Firebase,
	Unit_Thunderstorm,
	Unit_TSPDF,
	Unit_Slack,
	Unit_LiveDocs,
	Unit_UserAccount,
	Unit_Permissions,
	Unit_TSShortUrl,
	Unit_DependencyViewer,
	Unit_FocusedObject,
	Unit_Messaging,
	Unit_Workspace,
	Unit_PushPubSub,
	Unit_Jira,
	Unit_BugReport,
	Unit_Github,
	Unit_FileUpload,
	Unit_TSOpenAI,
	Unit_SchemaToTypes
];