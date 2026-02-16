import { addItemToArrayAtIndex, currentTimeMillis, generateHex, Module, removeFromArrayByIndex } from '@nu-art/ts-common';
import { StorageKey } from '@nu-art/thunder-core';
import { ThunderDispatcher } from '@nu-art/thunder-core';
export const NotificationStatus_Normal = 'normal';
export const NotificationStatus_InProgress = 'in-progress';
export const NotificationStatus_Resolved = 'resolved';
export const NotificationStatus_Failed = 'failed';
const dispatch_showNotifications = new ThunderDispatcher('__showNotifications');
export class ModuleFE_Notifications_Class extends Module {
    maxNotifications;
    notificationStorage;
    showing = [];
    timeouts = {};
    constructor(maxNotifications = 15) {
        super();
        this.notificationStorage = new StorageKey('notifications');
        this.maxNotifications = maxNotifications;
    }
    create(id) {
        const __created = currentTimeMillis();
        const list = this.notificationStorage.get([]) ?? [];
        const notification = list.find(n => n._id === id) ?? {
            postDelayed: 5000,
            status: NotificationStatus_Normal,
            title: '',
            message: '',
            _id: generateHex(8),
            __created,
            __updated: __created,
            _v: '1.0.0'
        };
        const uiNotification = {
            postDelayed: (postDelayed) => {
                notification.postDelayed = postDelayed;
                return uiNotification;
            },
            content: (title, message) => {
                notification.title = title;
                notification.message = message || '';
                return uiNotification;
            },
            setStatus: (status) => {
                notification.status = status;
                return uiNotification;
            },
            execute: async (action) => {
                notification.status = NotificationStatus_InProgress;
                uiNotification.show(-1);
                try {
                    const t = await action(uiNotification);
                    notification.status = NotificationStatus_Resolved;
                    uiNotification.show();
                    return t;
                }
                catch (e) {
                    notification.status = NotificationStatus_Failed;
                    uiNotification.show();
                    throw e;
                }
            },
            show: (postDelay) => {
                this.showImpl(notification, postDelay || notification.postDelayed);
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
    upsert(notification) {
        const notifications = this.notificationStorage.get([]) ?? [];
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
    showImpl(notification, postDelay) {
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
    hide(notification) {
        const index = this.showing.findIndex(n => n._id === notification._id);
        if (index === -1)
            return;
        removeFromArrayByIndex(this.showing, index);
        dispatch_showNotifications.dispatchUI(this.showing);
    }
    delete(notification) {
        this.hide(notification);
        const list = this.notificationStorage.get([]) ?? [];
        this.notificationStorage.set(list.filter(item => item._id !== notification._id));
    }
    showAllNotifications() {
        const notifications = this.notificationStorage.get([]) ?? [];
        dispatch_showNotifications.dispatchUI(notifications);
    }
    hideAllNotifications() {
        dispatch_showNotifications.dispatchUI([]);
    }
    async show(title, content, action) {
        const notification = this.create().content(title, content);
        try {
            await notification.execute(action);
            notification.content(`${title} - Success`).show();
        }
        catch (e) {
            this.logError(e);
            notification.content(`Failed ${title}`, e.message).show();
            throw e;
        }
        return notification;
    }
}
export const ModuleFE_Notifications = new ModuleFE_Notifications_Class();
//# sourceMappingURL=ModuleFE_Notifications.js.map