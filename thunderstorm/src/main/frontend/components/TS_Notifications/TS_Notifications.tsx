import {ComponentSync} from '../../core/ComponentSync';
import {Notification, Notification_Model, NotificationListener, ModuleFE_Notifications} from '../../component-modules/ModuleFE_Notifications';
import * as React from 'react';
import {LL_H_C, LL_V_L} from '../Layouts';
import {formatTimestamp} from '@nu-art/ts-common';
import './TS_Notifications.scss';
import {TS_ComponentTransition} from '../TS_ComponentTransition';

type State = {
	notifications: Notification[];
	timeout?: NodeJS.Timeout;
	timeoutMs?: number;
	showNotifications: boolean;
}

export class TS_Notifications
	extends ComponentSync<{}, State>
	implements NotificationListener {

	// ######################### Static #########################

	private overlayClass: string = 'ts-notification-overlay';
	private containerClass: string = 'ts-notification-container';


	// ######################### Life Cycle #########################

	__showNotifications(notificationModel?: Notification_Model) {
		this.logInfo('Got notifications:', notificationModel?.notifications);
		//No model - delete state notifications
		if (!notificationModel) {
			this.setState({
				showNotifications: false
			});
			return;
		}

		this.setState({
			notifications: notificationModel.notifications,
			timeout: notificationModel.closeTimeout === -1 ? undefined : setTimeout(() => this.setState({showNotifications: false}), notificationModel.closeTimeout),
			showNotifications: true,
			timeoutMs: notificationModel.closeTimeout,
		});
	}

	protected deriveStateFromProps(nextProps: any): State {
		return {
			showNotifications: false,
			notifications: []
		};
	}

	// ######################### Logic #########################

	private onClickToClose = (e: React.MouseEvent) => {
		ModuleFE_Notifications.hideAllNotifications();
		const elements = document.elementsFromPoint(e.clientX, e.clientY);
		const firstNonNotificationElement = elements.find(item => !item.className.includes(this.overlayClass) && !item.className.includes(this.containerClass));
		//@ts-ignore
		firstNonNotificationElement.click();
	};

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

	private renderNotifications = () => {
		if (!this.state.timeoutMs)
			return '';

		if (this.state.timeoutMs >= 0)
			this.renderNotification(this.state.notifications[0]);

		return this.state.notifications.map(notification => this.renderNotification(notification));
	};

	render() {
		return <>
			{this.state.showNotifications && <div className={'ts-notification-overlay'} onClick={this.onClickToClose}/>}
			<TS_ComponentTransition
				trigger={this.state.showNotifications}
				transitionTimeout={300}
			>
				<LL_V_L className={'ts-notification-container'} onClick={this.onClickToClose}>
					{this.renderNotifications()}
				</LL_V_L>
			</TS_ComponentTransition>
		</>;
	}
}