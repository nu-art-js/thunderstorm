import {ComponentSync} from '../../core/ComponentSync';
import {
	DB_Notification,
	ModuleFE_Notifications,
	NotificationListener
} from '../../component-modules/ModuleFE_Notifications';
import * as React from 'react';
import {LL_H_C, LL_V_L} from '../Layouts';
import {formatTimestamp} from '@nu-art/ts-common';
import './TS_Notifications.scss';
import {TS_ComponentTransition} from '../TS_ComponentTransition';
import {_className, stopPropagation} from '../../utils/tools';

type State = {
	notifications: DB_Notification[];
	showNotifications: boolean;
}

export class TS_Notifications
	extends ComponentSync<{}, State>
	implements NotificationListener {

	// ######################### Static #########################

	private overlayClass: string = 'ts-notification-overlay';
	private containerClass: string = 'ts-notification-container';
	private transitionTimeout: number = 300;
	private timeout: NodeJS.Timeout | undefined = undefined;

	// ######################### Life Cycle #########################

	__showNotifications(notifications: DB_Notification[]) {
		if (notifications.length === 0) { //If there are no notifications to show
			//Transition notifications out
			this.setState({showNotifications: false}, () => {
				//Get rid of notifications in state after they are out of view
				this.timeout = setTimeout(() => {
					this.setState({notifications});
				}, this.transitionTimeout);
			});

		} else { //There are notifications to show
			clearTimeout(this.timeout);
			this.setState({notifications: [...notifications], showNotifications: true});
			this.forceUpdate();
		}
	}

	protected deriveStateFromProps(nextProps: any): State {
		return {
			notifications: [],
			showNotifications: false,
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

	private deletePost = (e: React.MouseEvent, notification: DB_Notification) => {
		stopPropagation(e);
		ModuleFE_Notifications.create(notification._id).delete();
		//Next line should be removed when the module dispatches new list after deletion
		this.setState({notifications: this.state.notifications.filter(item => item._id !== notification._id)});
	};

	private onNotificationClick = (e: React.MouseEvent, notification: DB_Notification) => {
		stopPropagation(e);
	};

	// ######################### Render #########################

	private renderNotification(notification: DB_Notification) {
		return <LL_V_L className={`ts-notification ts-notification__${notification.status}`} key={notification._id}
					   onClick={e => this.onNotificationClick(e, notification)}>
			<LL_H_C className={'ts-notification__header'}>
				<div className={'ts-notification__title'}>{notification.title}</div>
				<span className={'ts-notification__close'} onClick={(e) => {
					if (notification.status === 'in-progress') {
						ModuleFE_Notifications.hideAllNotifications();
						return;
					}
					this.deletePost(e, notification);
				}}>&#10005;</span>
			</LL_H_C>
			<LL_V_L className={'ts-notification__body'}>
				<div className={'ts-notification__message'}>{notification.message}</div>
			</LL_V_L>
			<LL_H_C className={'ts-notification__footer'}>
				<div
					className={'ts-notification__timestamp'}>{formatTimestamp('DD/M - hh:mm A', notification.__created)}</div>
			</LL_H_C>
		</LL_V_L>;
	}

	private renderNotifications = () => {
		if (!this.state.notifications.length)
			return '';
		return this.state.notifications.map(notification => this.renderNotification(notification));
	};

	render() {
		const className = _className('ts-notification-container', this.state.notifications.length > 1 ? 'list' : undefined);
		return <TS_ComponentTransition trigger={this.state.showNotifications}
									   transitionTimeout={this.transitionTimeout}>
			<div className={'ts-notification-overlay'} onClick={e => this.onClickToClose(e, 'click')}
				 onContextMenu={e => this.onClickToClose(e, 'contextmenu')}>
				<LL_V_L className={className} onClick={e => this.onClickToClose(e, 'click')}
						onContextMenu={e => this.onClickToClose(e, 'contextmenu')}>
					{this.renderNotifications()}
				</LL_V_L>
			</div>
		</TS_ComponentTransition>;
	}
}