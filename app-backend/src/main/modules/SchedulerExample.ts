import {FirebaseScheduledFunction} from "@nu-art/firebase/backend-functions";

export class SchedulerExample_Class
	extends FirebaseScheduledFunction {

	constructor() {
		super('every 2 minutes', "schedulerExample");
	}

	onScheduledEvent = async (): Promise<any> => {
		console.log("Do something");
	};
}

export const SchedulerExample = new SchedulerExample_Class();