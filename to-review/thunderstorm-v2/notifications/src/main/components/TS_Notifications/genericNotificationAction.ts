/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
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

import {Second, StaticLogger} from '@nu-art/ts-common';
import {ModuleFE_Notifications, UI_Notification} from '../../component-modules/ModuleFE_Notifications.js';


type UI_NotificationTitle = string | { inProgress: string, failed?: string | ((e: any) => string), success?: string };

export const genericNotificationAction = async (action: (notification: UI_Notification) => Promise<any>, _title: UI_NotificationTitle, postDelay: number = 1.5) => {
	const title = typeof _title === 'string' ? _title : _title.inProgress;
	const successTitle = typeof _title === 'string' ? title + ' - Success' : _title.success || title + ' - Success';
	const notification = ModuleFE_Notifications.create().content(title).postDelayed(postDelay * Second);

	try {
		await notification.execute(action);
		notification.content(successTitle).show();
	} catch (e: any) {
		const failTitle = typeof _title === 'string' ? title + ' - Failed' : typeof _title.failed === 'string'
			? _title.failed
			: _title.failed?.(e) || title + ' - Failed';
		notification.content(failTitle, e.message).show();
		StaticLogger.logError(e);
	}
};
