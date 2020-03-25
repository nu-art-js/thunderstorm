import {FirebaseScheduledFunction} from "@nu-art/firebase/backend-functions";

export class StopLongRecordings_Class
	extends FirebaseScheduledFunction<any> {

	constructor() {
		super("stopRecordings");
		console.log("StopLongRecordings ctor")
	}

	async processChanges(): Promise<any> {
		console.log("processChanges");
	}

}

export const StopLongRecordings = new StopLongRecordings_Class();