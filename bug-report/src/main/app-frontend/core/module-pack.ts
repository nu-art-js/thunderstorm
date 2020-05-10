import {BugReportModule} from "../modules/BugReportModule";
import {AdminBRModule} from "../modules/AdminBRModule";

export const Frontend_ModulePack_BugReport = [
	BugReportModule,
	AdminBRModule
];

export * from "../modules/AdminBRModule"
export * from "../modules/BugReportModule"

