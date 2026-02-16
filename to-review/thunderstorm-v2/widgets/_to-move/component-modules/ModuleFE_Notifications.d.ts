import { DB_Object, Module } from '@nu-art/ts-common';
type NS_Normal = 'normal';
type NS_InProgress = 'in-progress';
type NS_Resolved = 'resolved';
type NS_Failed = 'failed';
export declare const NotificationStatus_Normal: NS_Normal;
export declare const NotificationStatus_InProgress: NS_InProgress;
export declare const NotificationStatus_Resolved: NS_Resolved;
export declare const NotificationStatus_Failed: NS_Failed;
export type NotificationStatus = NS_Normal | NS_InProgress | NS_Resolved | NS_Failed;
export type DB_Notification = DB_Object & {
    title: string;
    message: string;
    postDelayed: number;
    status: NotificationStatus;
};
export interface UI_Notification {
    postDelayed: (postDelayed: number) => UI_Notification;
    content: (title: string, message?: string) => UI_Notification;
    execute: <T>(action: (notification: UI_Notification) => Promise<T>) => Promise<T>;
    setStatus: (status: NotificationStatus) => UI_Notification;
    show: (postDelay?: number) => void;
    hide: () => void;
    delete: () => void;
}
export interface NotificationListener {
    __showNotifications(notifications: DB_Notification[]): void;
}
export declare class ModuleFE_Notifications_Class extends Module<{}> {
    readonly maxNotifications: number;
    private notificationStorage;
    private showing;
    private timeouts;
    constructor(maxNotifications?: number);
    create(id?: string): UI_Notification;
    private upsert;
    private showImpl;
    private hide;
    private delete;
    showAllNotifications(): void;
    hideAllNotifications(): void;
    show(title: string, content: string, action: () => Promise<any>): Promise<UI_Notification>;
}
export declare const ModuleFE_Notifications: ModuleFE_Notifications_Class;
export {};
