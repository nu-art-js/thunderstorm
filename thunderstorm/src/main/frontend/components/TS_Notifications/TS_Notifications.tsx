import {ComponentSync} from '../../core/ComponentSync';
import {ModuleFE_Notifications, Notification, Notification_Model, NotificationListener} from '../../component-modules/ModuleFE_Notifications';
import * as React from 'react';
import {LL_H_C, LL_V_L} from '../Layouts';
import {formatTimestamp} from '@nu-art/ts-common';
import './TS_Notifications.scss';
import {TS_ComponentTransition} from '../TS_ComponentTransition';
import {_className, stopPropagation} from '../../utils/tools';

type State = {
	notifications: Notification[];
	timeoutMs?: number;
	showNotifications: boolean;
}

export class TS_Notifications
	extends ComponentSync<{}, State>
	implements NotificationListener {

	// ######################### Static #########################

	private overlayClass: string = 'ts-notification-overlay';
	private containerClass: string = 'ts-notification-container';
	private timeout: NodeJS.Timeout | undefined = undefined;


	// ######################### Life Cycle #########################

	__showNotifications(notificationModel?: Notification_Model) {
		//No model - delete state notifications
		if (!notificationModel) {
			clearTimeout(this.timeout);
			this.setState({
				showNotifications: false,
			});
			return;
		}

		if (notificationModel.closeTimeout !== -1)
			this.timeout = setTimeout(() => this.setState({showNotifications: false}), notificationModel.closeTimeout);
		this.setState({
			notifications: notificationModel.notifications,
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

	private onClickToClose = (e: React.MouseEvent, eventType: 'click' | 'contextmenu') => {
		ModuleFE_Notifications.hideAllNotifications();
		const elements = document.elementsFromPoint(e.clientX, e.clientY);
		const firstNonNotificationElement = elements.find(item => {
			//not always false, svg className is an object
			if (typeof item.className !== 'string')
				return false;
			return item.className && !item.className.includes(this.overlayClass) && !item.className.includes(this.containerClass);
		});

		const ev = new MouseEvent(eventType, {
			bubbles: true,
			cancelable: true,
			view: firstNonNotificationElement!.ownerDocument.defaultView,
			detail: 1,
			screenX: e.screenX,
			screenY: e.screenY,
			clientX: e.clientX,
			clientY: e.clientY,
			ctrlKey: e.ctrlKey,
			altKey: e.altKey,
			shiftKey: e.shiftKey,
			metaKey: e.metaKey,
			button: e.button,
			buttons: e.buttons,
			relatedTarget: firstNonNotificationElement,
		});

		//@ts-ignore
		firstNonNotificationElement.dispatchEvent(ev);
	};

	private deletePost = (e: React.MouseEvent, id: string) => {
		stopPropagation(e);
		this.setState({notifications: this.state.notifications.filter(item => item.id !== id)});
		ModuleFE_Notifications.deletePost(id);
	};

	// ######################### Render #########################

	private renderNotification(notification: Notification) {
		return <LL_V_L className={`ts-notification ts-notification__${notification.status}`}>
			<LL_H_C className={'ts-notification__header'}>
				<div className={'ts-notification__title'}>{notification.title}</div>
				<span className={'ts-notification__close'} onClick={(e) => this.deletePost(e, notification.id)}>&#10005;</span>
			</LL_H_C>
			<LL_V_L className={'ts-notification__body'}>
				<div className={'ts-notification__message'}>{notification.message}</div>
			</LL_V_L>
			<LL_H_C className={'ts-notification__footer'}>
				<div className={'ts-notification__timestamp'}>{formatTimestamp('DD/M - hh:mm A', notification.timestamp)}</div>
			</LL_H_C>
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
		const className = _className('ts-notification-container', this.state.notifications.length > 1 ? 'list' : undefined);
		return <>
			{this.state.showNotifications &&
				<div className={'ts-notification-overlay'} onClick={e => this.onClickToClose(e, 'click')} onContextMenu={e => this.onClickToClose(e, 'contextmenu')}/>}
			<TS_ComponentTransition
				trigger={this.state.showNotifications}
				transitionTimeout={300}
			>
				<LL_V_L className={className} onClick={e => this.onClickToClose(e, 'click')} onContextMenu={e => this.onClickToClose(e, 'contextmenu')}>
					{this.renderNotifications()}
				</LL_V_L>
			</TS_ComponentTransition>
		</>;
	}
}
