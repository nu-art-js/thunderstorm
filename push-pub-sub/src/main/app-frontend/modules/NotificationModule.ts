/*
 * A generic push pub sub infra for webapps
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {ThunderDispatcher} from '@nu-art/thunderstorm/app-frontend/core/thunder-dispatcher';
import {Minute, Module, removeItemFromArray} from '@nu-art/ts-common';
import {DB_Notifications, PubSubReadNotification} from '../..';
import {XhrHttpModule} from '@nu-art/thunderstorm/frontend';
import {HttpMethod} from '@nu-art/thunderstorm';


export interface OnNotificationsUpdated {
	__onNotificationsUpdated(): void;
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
		dispatch_NotificationsUpdated.dispatchUI();
	};

	addNotification(newNotification: DB_Notifications) {
		this.notifications.push(newNotification);
		dispatch_NotificationsUpdated.dispatchUI();
	}

	removeNotification(notification: DB_Notifications) {
		removeItemFromArray(this.notifications, notification);
		dispatch_NotificationsUpdated.dispatchUI();
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
			.setRelativeUrl('/v1/push/read')
			.setBodyAsJson(body)
			.setOnError('Something went wrong while reading your notification')
			.setTimeout(Minute)
			.execute(() => {
				dispatch_NotificationsUpdated.dispatchUI();
			});
	};

}

export const NotificationsModule = new NotificationsModule_Class();