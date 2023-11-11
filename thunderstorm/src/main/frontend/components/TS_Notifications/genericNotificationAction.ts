import {Second, StaticLogger} from '@nu-art/ts-common';
import {ModuleFE_Notifications, UI_Notification} from '../../component-modules/ModuleFE_Notifications';


type UI_NotificationTitle = string | { inProgress: string, failed?: string | ((e: any) => string), success?: string };

export const genericNotificationAction = async (action: (notification: UI_Notification) => Promise<any>, _title: UI_NotificationTitle, postDelay: number = 1.5) => {
	const title = typeof _title === 'string' ? _title : _title.inProgress;
	const successTitle = typeof _title === 'string' ? title + ' - Success' : _title.success || title + ' - Success';
	const notification = ModuleFE_Notifications.create().content(title).postDelayed(postDelay * Second);

	try {
		await notification.execute(action);
		notification.content(successTitle).show();
	} catch (e: any) {
		const failTitle = typeof _title === 'string' ? title + ' - Failed' : typeof _title.failed === 'string' ? _title.failed : _title.failed?.(e) || title + ' - Failed';
		notification.content(failTitle, e.message).show();
		StaticLogger.logError(e);
	}
};