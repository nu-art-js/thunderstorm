import * as React from "react";
import {genericNotificationAction} from "../../components/TS_Notifications";
import {ToastBuilder} from "../../component-modules/ModuleFE_Toaster";
import {generateErrorToast} from "./genereteToasts";

export type FeedbackOptions = {
    type: 'notification' | 'toast';
    duration?: number;
    notificationLabels?: string | { inProgress: string, failed?: string | ((e: any) => string), success?: string };
    toast?: React.ReactNode;
    toastMessage?: string;
}

const Default_Toast_Duration: number = 4000;

const Successful_Action_Default_Label = 'Action Preformed Successfully';


/**
 * #preformAction
 * use this function to exectute any async action that requires a feedback.
 * @param action the action to execute.
 * @param feedbackOptions feedback options to determine which kind of feedback to present
 * @param additionalData !Optional! any additional data the notification/toast might need
 */
export async function preformAction(action: () => Promise<any>, feedbackOptions: FeedbackOptions, additionalData?: any) {
    switch (feedbackOptions.type) {
        case "notification":
            if (feedbackOptions.notificationLabels) {
                await genericNotificationAction(action, feedbackOptions.notificationLabels);
            } else {
                console.error('cannot use notification as feedback without labels')
            }
            break;
        case "toast":
            try {
                const Toast: any = feedbackOptions.toast ? feedbackOptions.toast :
                    <div>{Successful_Action_Default_Label}</div>;
                await action();
                new ToastBuilder().setContent(feedbackOptions.toast &&
                    <Toast iconKey={'v'} toastType={'success'} content={feedbackOptions.toastMessage}/>)
                    .setDuration(feedbackOptions.duration ? feedbackOptions.duration : Default_Toast_Duration).show();
            } catch (err) {
                new ToastBuilder()
                    .setContent(generateErrorToast(err, feedbackOptions.toast && feedbackOptions.toast, additionalData))
                    .setDuration(feedbackOptions.duration ? feedbackOptions.duration : Default_Toast_Duration).show()
            }
    }
}