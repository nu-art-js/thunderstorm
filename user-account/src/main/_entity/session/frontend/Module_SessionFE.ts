import {Module} from "@nu-art/ts-common";

class Module_SessionFE
	extends Module
	implements OnStorageKeyChangedListener {

	// @ts-ignore
	private sessionData!: TS_Object;

}