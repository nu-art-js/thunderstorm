import {FirebaseScheduledFunction} from "@nu-art/firebase/app-backend/functions/firebase-function";


export class StopLongRecordings_Class
	extends FirebaseScheduledFunction<{}> {

}

export const StopLongRecordings = new StopLongRecordings_Class();