import {FirebaseScheduledFunction} from "@nu-art/firebase/app-backend/functions/firebase-function";


export class StopLongRecordings_Class
	extends FirebaseScheduledFunction<any> {

	constructor() {
		super();
		console.log("StopLongRecordings ctor")
	}

	async processChanges(): Promise<any> {
		console.log("processChanges");
	}

}

export const StopLongRecordings = new StopLongRecordings_Class();