import {cloneArr, currentTimeMillis, generateHex, Module, Second} from '@nu-art/ts-common';
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

	private notificationStorage: StorageKey<Notification[]>;
	private notifications: Notification[];
	private maxNotifications: number;

	constructor() {
		super();
		this.notificationStorage = new StorageKey<Notification[]>('notifications');
		this.notifications = this.notificationStorage.get([]);
		this.maxNotifications = 5;
	}

	post(notification: Omit<Notification, 'id' | 'timestamp'>): string {
		const id = generateHex(8);
		const timestamp = currentTimeMillis();
		//Push the new notification into the array
		this.notifications.unshift({
			...notification,
			id,
			timestamp,
		});

		//If length of array is bigger than max, pop last item
		if (this.notifications.length > this.maxNotifications)
			this.notifications.pop();

		this.showSingleNotification(id);
		return id;
	}

	updatePost(id: string, notification: Partial<Omit<Notification, 'id'>>) {
		const notificationIndex = this.notifications.findIndex(item => item.id === id);

		if (notificationIndex === -1) {
			this.logError(`Could not find notification with id ${id}`);
			return;
		}

		this.notifications[notificationIndex] = {
			...this.notifications[notificationIndex],
			...notification,
		};
	}

	deletePost(id: string) {
		this.notifications = this.notifications.filter(item => item.id !== id);
	}

	showSingleNotification(id: string) {
		const notification = this.notifications.find(item => item.id === id);
		if (!notification)
			return;

		dispatch_showNotifications.dispatchUI({notifications: [notification], closeTimeout: 2 * Second});
	}

	showAllNotifications() {
		const notifications = cloneArr(this.notifications);
		dispatch_showNotifications.dispatchUI({notifications, closeTimeout: -1});
	}


}

export const ModuleFE_Notifications = new ModuleFE_Notifications_Class();