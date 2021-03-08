import {ThunderDispatcher} from "@nu-art/thunderstorm/app-frontend/core/thunder-dispatcher";
import {
	Minute,
	Module,
	removeItemFromArray
} from "@nu-art/ts-common";
import {
	DB_Notifications,
	PubSubReadNotification
} from "../..";
import {XhrHttpModule} from "@nu-art/thunderstorm/frontend";
import {HttpMethod} from "@nu-art/thunderstorm";

export interface OnNotificationsUpdated {
	__onNotificationsUpdated(): void
}

export const dispatch_NotificationsUpdated = new ThunderDispatcher<OnNotificationsUpdated, '__onNotificationsUpdated'>('__onNotificationsUpdated');


export class NotificationsModule_Class
	extends Module {

	private notifications: DB_Notifications[] = [];

	getNotifications() {
		return this.notifications;
	}

	setNotificationList = (notifications: DB_Notifications[]) => {
		this.notifications = notifications;
		dispatch_NotificationsUpdated.dispatchUI([]);
	};

	addNotification(newNotification: DB_Notifications) {
		this.notifications.push(newNotification);
		dispatch_NotificationsUpdated.dispatchUI([]);
	}

	removeNotification(notification: DB_Notifications) {
		removeItemFromArray(this.notifications, notification);
		dispatch_NotificationsUpdated.dispatchUI([]);
		return notification._id;
	}

	read = (notification: DB_Notifications, read: boolean) => {
		const readNotification = this.notifications.find(_notification => _notification._id === notification._id);
		if (!readNotification || !readNotification.persistent)
			return;

		readNotification.read = read;
		this.readNotification(notification._id, read);
	};

	readNotification = (id: string, read: boolean) => {
		const body = {
			_id: id,
			read
		};

		XhrHttpModule
			.createRequest<PubSubReadNotification>(HttpMethod.POST, 'read-notification')
			.setRelativeUrl("/v1/push/read")
			.setJsonBody(body)
			.setOnError('Something went wrong while reading your notification')
			.setTimeout(Minute)
			.execute(() => {
				dispatch_NotificationsUpdated.dispatchUI([]);
			});
	};

}

export const NotificationsModule = new NotificationsModule_Class();