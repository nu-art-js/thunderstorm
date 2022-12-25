import {addItemToArrayAtIndex, currentTimeMillis, DB_Object, generateHex, Module, removeFromArrayByIndex} from '@nu-art/ts-common';
import {StorageKey} from '../modules/ModuleFE_LocalStorage';
import {ThunderDispatcher} from '../core/thunder-dispatcher';


type NS_Normal = 'normal';
type NS_InProgress = 'in-progress';
type NS_Resolved = 'resolved';
type NS_Failed = 'failed';

export const NotificationStatus_Normal: NS_Normal = 'normal';
export const NotificationStatus_InProgress: NS_InProgress = 'in-progress';
export const NotificationStatus_Resolved: NS_Resolved = 'resolved';
export const NotificationStatus_Failed: NS_Failed = 'failed';

export type NotificationStatus = NS_Normal | NS_InProgress | NS_Resolved | NS_Failed;

export type DB_Notification = DB_Object & {
	title: string;
	message: string;
	postDelayed: number
	status: NotificationStatus
}

export interface UI_Notification {
	postDelayed: (postDelayed: number) => UI_Notification;
	content: (title: string, message?: string) => UI_Notification;
	execute: <T>(action: () => Promise<T>) => Promise<T>;
	show: (postDelay?: number) => void;
	hide: () => void;
	delete: () => void;
}

export interface NotificationListener {
	__showNotifications(notifications: DB_Notification[]): void;
}

const dispatch_showNotifications = new ThunderDispatcher<NotificationListener, '__showNotifications'>('__showNotifications');

export class ModuleFE_Notifications_Class
	extends Module<{}> {

	readonly maxNotifications: number;
	private notificationStorage: StorageKey<DB_Notification[]>;
	private showing: DB_Notification[] = [];
	private timeouts: { [k: string]: any } = {};

	constructor(maxNotifications: number = 15) {
		super();
		this.notificationStorage = new StorageKey<DB_Notification[]>('notifications');
		this.maxNotifications = maxNotifications;
	}

	create(id?: string): UI_Notification {
		const __created = currentTimeMillis();

		const notification: DB_Notification = this.notificationStorage.get([]).find(n => n._id === id) || {
			postDelayed: 5000,
			status: NotificationStatus_Normal,
			title: '',
			message: '',
			_id: generateHex(8),
			__created,
			__updated: __created,
			_v: '1.0.0'
		};

		const uiNotification: UI_Notification = {
			postDelayed: (postDelayed: number) => {
				notification.postDelayed = postDelayed;
				return uiNotification;
			},
			content: (title: string, message?: string) => {
				notification.title = title;
				notification.message = message || '';
				return uiNotification;
			},
			execute: async <T>(action: () => Promise<T>) => {
				notification.status = NotificationStatus_InProgress;
				uiNotification.show(-1);
				try {
					const t = await action();
					notification.status = NotificationStatus_Resolved;
					uiNotification.show();
					return t;
				} catch (e) {
					notification.status = NotificationStatus_Failed;
					uiNotification.show();
					throw e;
				}
			},
			show: (postDelay?: number) => {
				this.show(notification, postDelay || notification.postDelayed);
			},
			hide: () => {
				this.hide(notification);
			},
			delete: () => {
				this.delete(notification);
			},
		};
		return uiNotification;
	}

	private upsert(notification: DB_Notification) {
		const notifications = this.notificationStorage.get([]);
		const index = notifications.findIndex(n => n._id === notification._id);
		if (index !== -1)
			notifications[index] = notification;
		else
			addItemToArrayAtIndex(notifications, notification, 0);

		//If length of array is bigger than max, pop last item
		if (notifications.length > this.maxNotifications)
			notifications.pop();

		this.notificationStorage.set(notifications);
	}

	private show(notification: DB_Notification, postDelay: number) {
		this.upsert(notification);

		const index = this.showing.findIndex(n => n._id === notification._id);
		if (index !== -1)
			this.showing[index] = notification;
		else
			addItemToArrayAtIndex(this.showing, notification, 0);

		dispatch_showNotifications.dispatchUI(this.showing);
		if (this.timeouts[notification._id]) {
			clearTimeout(this.timeouts[notification._id]);
			delete this.timeouts[notification._id];
		}

		if (postDelay <= 0)
			return;

		const timeoutId = setTimeout(() => this.hide(notification), postDelay);
		this.timeouts[notification._id] = timeoutId;
	}

	private hide(notification: DB_Notification) {
		const index = this.showing.findIndex(n => n._id === notification._id);
		if (index === -1)
			return;

		removeFromArrayByIndex(this.showing, index);
		dispatch_showNotifications.dispatchUI(this.showing);
	}

	private delete(notification: DB_Notification) {
		this.hide(notification);

		this.notificationStorage.set(this.notificationStorage.get([]).filter(item => item._id !== notification._id));
	}

	showAllNotifications() {
		const notifications = this.notificationStorage.get([]);
		dispatch_showNotifications.dispatchUI(notifications);
	}

	hideAllNotifications() {
		dispatch_showNotifications.dispatchUI([]);
	}
}

export const ModuleFE_Notifications = new ModuleFE_Notifications_Class();
