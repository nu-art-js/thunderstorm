import {Second, StaticLogger} from '@nu-art/ts-common';
import {ModuleFE_Notifications} from '../../component-modules/ModuleFE_Notifications';

export const genericNotificationAction = async (action: () => Promise<any>, _title: string | { inProgress: string, failed?: string | ((e: any) => string), success?: string }) => {
	const title = typeof _title === 'string' ? _title : _title.inProgress;
	const successTitle = typeof _title === 'string' ? title + ' - Success' : _title.success || title + ' - Success';
	const notification = ModuleFE_Notifications.create().content(title).postDelayed(1.5 * Second);

	try {
		await notification.execute(action);
		notification.content(successTitle).show();
	} catch (e: any) {
		const failTitle = typeof _title === 'string' ? title + ' - Failed' : typeof _title.failed === 'string' ? _title.failed : _title.failed?.(e) || title + ' - Failed';
		notification.content(failTitle, e.message).show();
		StaticLogger.logError(e);
	}
};