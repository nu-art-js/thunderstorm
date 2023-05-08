import * as React from 'react';
import {genericNotificationAction} from '../../components/TS_Notifications';
import {ToastBuilder} from '../../component-modules/ModuleFE_Toaster';
import {generateErrorToastContent} from './genereteToasts';

export type FeedbackOptions = {
	type: 'toast';
	successContent?: React.ReactNode;
	failContent?: React.ReactNode;
	duration?: number;
} | {
	type: 'notification',
	notificationLabels?: string | { inProgress: string, failed?: string | ((e: any) => string), success?: string };
}

const Default_Toast_Duration: number = 4000;

const Successful_Action_Default_Label = 'Action Preformed Successfully';
const Failed_Action_Default_Label = 'Action Failed';

/**
 * #preformAction
 * use this function to execute any async action that requires a feedback.
 * @param action the action to execute.
 * @param feedbackOptions feedback options to determine which kind of feedback to present
 * @param additionalData !Optional! any additional data the notification/toast might need
 * @param throwBackError !Optional! if true, will throw error back outside the action
 */
export async function performAction(action: () => Promise<any>, feedbackOptions: FeedbackOptions, additionalData?: any, throwBackError: boolean = false) {
	switch (feedbackOptions.type) {
		case 'notification':
			if (feedbackOptions.notificationLabels) {
				await genericNotificationAction(action, feedbackOptions.notificationLabels);
			} else {
				console.error('cannot use notification as feedback without labels');
			}
			break;
		case 'toast':
			try {
				const content: React.ReactNode = feedbackOptions.successContent ?? <div>{Successful_Action_Default_Label}</div>;
				await action();
				new ToastBuilder()
					.setContent(content)
					.setDuration(feedbackOptions.duration ?? Default_Toast_Duration)
					.show();
			} catch (err: any) {
				const content: React.ReactNode = feedbackOptions.failContent ?? <div>{Failed_Action_Default_Label}</div>;
				new ToastBuilder()
					.setContent(generateErrorToastContent(err, content, additionalData))
					.setDuration(feedbackOptions.duration ? feedbackOptions.duration : Default_Toast_Duration).show();
				if (throwBackError)
					throw err;
			}
	}
}