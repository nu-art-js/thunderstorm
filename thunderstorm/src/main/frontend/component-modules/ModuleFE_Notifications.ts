import {currentTimeMillis, generateHex, Module, Second} from '@nu-art/ts-common';
import {StorageKey} from '../modules/ModuleFE_LocalStorage';
import {ThunderDispatcher} from '../core/thunder-dispatcher';

export type NotificationStatus = 'normal' | 'in-progress' | 'resolved' | 'failed';

export type Notification = {
	id: string;
	title: string;
	message: string;
	status: NotificationStatus
	timestamp: number;
}

export type Notification_Model = {
	notifications: Notification[];
	closeTimeout: number;
}

export interface NotificationListener {
	__showNotifications(notificationModel?: Notification_Model): void;
}

const dispatch_showNotifications = new ThunderDispatcher<NotificationListener, '__showNotifications'>('__showNotifications');

export class ModuleFE_Notifications_Class
	extends Module<{}> {

	readonly maxNotifications: number;
	private notificationStorage: StorageKey<Notification[]>;

	constructor(maxNotifications: number = 15) {
		super();
		this.notificationStorage = new StorageKey<Notification[]>('notifications');
		this.maxNotifications = maxNotifications;
	}

	post(notification: Omit<Notification, 'id' | 'timestamp'>, timeOutSec?: number): string {
		const id = generateHex(8);
		const timestamp = currentTimeMillis();
		const notifications = this.notificationStorage.get([]);
		//Push the new notification into the array
		notifications.unshift({
			...notification,
			id,
			timestamp,
		});

		//If length of array is bigger than max, pop last item
		if (notifications.length > this.maxNotifications)
			notifications.pop();

		this.notificationStorage.set(notifications);
		this.showSingleNotification(id, timeOutSec);
		return id;
	}

	updatePost(id: string, notification: Partial<Omit<Notification, 'id'>>) {
		const notifications = this.notificationStorage.get([]);
		const notificationIndex = notifications.findIndex(item => item.id === id);

		if (notificationIndex === -1) {
			this.logError(`Could not find notification with id ${id}`);
			return;
		}

		notifications[notificationIndex] = {
			...notifications[notificationIndex],
			...notification,
		};
		this.notificationStorage.set(notifications);
		this.showSingleNotification(notifications[notificationIndex].id);
	}

	deletePost(id: string) {
		let notifications = this.notificationStorage.get([]);
		notifications = notifications.filter(item => item.id !== id);
		this.notificationStorage.set(notifications);
	}

	showSingleNotification(id: string, timeoutSec: number = 5) {
		const notification = this.notificationStorage.get([]).find(item => item.id === id);
		if (!notification)
			return;

		dispatch_showNotifications.dispatchUI({notifications: [notification], closeTimeout: timeoutSec * Second});
	}

	showAllNotifications() {
		const notifications = this.notificationStorage.get([]);
		dispatch_showNotifications.dispatchUI({notifications, closeTimeout: -1});
	}

	hideAllNotifications() {
		dispatch_showNotifications.dispatchUI();
	}
}

export const ModuleFE_Notifications = new ModuleFE_Notifications_Class();