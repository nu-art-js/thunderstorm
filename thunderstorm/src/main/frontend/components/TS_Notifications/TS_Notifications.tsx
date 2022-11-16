import {ComponentSync} from '../../core/ComponentSync';
import {Notification, NotificationListener, Notification_Model} from '../../component-modules/ModuleFE_Notifications';
import * as React from 'react';
import {LL_H_C, LL_V_L} from '../Layouts';
import {formatTimestamp} from '@nu-art/ts-common';
import './TS_Notifications.scss';

type State = {
	notifications: Notification[];
	timeout?: NodeJS.Timeout;
}

export class TS_Notifications
	extends ComponentSync<{}, State>
	implements NotificationListener {

	// ######################### Life Cycle #########################

	__showNotifications(notificationModel?: Notification_Model) {
		this.logInfo('Got notifications:', notificationModel?.notifications);
		//No model - delete state notifications
		if (!notificationModel) {
			this.hideNotifications();
			return;
		}

		this.setState({
			notifications: notificationModel.notifications,
			timeout: notificationModel.closeTimeout === -1 ? undefined : setTimeout(() => this.hideNotifications(), notificationModel.closeTimeout)
		});
	}

	protected deriveStateFromProps(nextProps: any): State {
		return {
			notifications: []
		};
	}

	// ######################### Logic #########################

	private hideNotifications() {
		this.setState({
			notifications: [],
			timeout: undefined,
		});
	}

	// ######################### Render #########################

	private renderNotification(notification: Notification) {
		return <LL_V_L className={'ts-notification'}>
			<LL_H_C className={'ts-notification__header'}>
				<div className={'ts-notification__title'}>{notification.title}</div>
				<div className={'ts-notification__timestamp'}>{formatTimestamp('HH:mm', notification.timestamp)}</div>
			</LL_H_C>
			<div className={'ts-notification__message'}>{notification.message}</div>
		</LL_V_L>;
	}

	private renderTimedNotification() {
		if (!this.state.timeout)
			return '';

		return this.renderNotification(this.state.notifications[0]);
	}

	render() {
		if (!this.state.notifications.length)
			return '';

		return <div className={'ts-notification-overlay'}>
			<LL_V_L className={'ts-notification-container'}>
				{this.renderTimedNotification()}

			</LL_V_L>
		</div>;
	}
}
