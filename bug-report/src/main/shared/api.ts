import {ApiWithBody, ApiWithQuery} from "@nu-art/thunderstorm";
import {DB_Object} from "@nu-art/firebase";
import {Auditable} from "@nu-art/ts-common";

export type BugReport = {
	name: string
	log: string[]
}

export type Request_BugReport = {
	subject: string;
	description: string;
	reports: BugReport[]
	createJiraIssue: boolean,
};

export declare type ReportMetaData = {
	description: string,
	path: string,
	minPath: string
}
export type DB_BugReport = DB_Object & Auditable & {
	subject: string;
	description: string
	reports: ReportLogFile[]
	bucket?: string
	jiraKey?: string
};

export type ReportLogFile = {
	name: string
	path: string
}

export type Paths = {
	path: string
}

export type SecuredUrl = {
	fileName: string
	securedUrl: string
	publicUrl: string
}

export type ApiGetLog = ApiWithQuery<string, DB_BugReport[]>
export type ApiPostPath = ApiWithBody<'/v1/bug-reports/download-logs', Paths, SecuredUrl>
export type ApiBugReport = ApiWithBody<'/v1/bug-reports/report', Request_BugReport, void>
