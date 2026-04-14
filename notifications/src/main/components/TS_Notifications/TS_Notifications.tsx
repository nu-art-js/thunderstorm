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

import {DB_Notification, ModuleFE_Notifications, NotificationListener} from '../../component-modules/ModuleFE_Notifications.js';
import * as React from 'react';
import {formatTimestamp} from '@nu-art/ts-common';
import './TS_Notifications.scss';
import {_className, stopPropagation} from '@nu-art/thunder-core';

type State = {
	notifications: DB_Notification[];
	showNotifications: boolean;
	transitionPhase: 'mount' | 'enter' | 'enter-done' | 'exit' | 'exit-done' | 'unmount';
}

export class TS_Notifications
	extends React.Component<{}, State>
	implements NotificationListener {

	private overlayClass: string = 'ts-notification-overlay';
	private containerClass: string = 'ts-notification-container';
	private transitionTimeout: number = 300;
	private timeout: NodeJS.Timeout | undefined = undefined;
	private transitionTimer: ReturnType<typeof setTimeout> | undefined = undefined;

	state: State = {
		notifications: [],
		showNotifications: false,
		transitionPhase: 'unmount',
	};

	__showNotifications(notifications: DB_Notification[]) {
		if (notifications.length === 0) {
			this.setState({showNotifications: false}, () => {
				this.timeout = setTimeout(() => {
					this.setState({notifications});
				}, this.transitionTimeout);
			});
		} else {
			clearTimeout(this.timeout);
			this.setState({notifications: [...notifications], showNotifications: true});
			this.forceUpdate();
		}
	}

	componentDidUpdate(_prevProps: {}, prevState: State) {
		const {showNotifications, transitionPhase} = this.state;
		if (transitionPhase !== prevState.transitionPhase)
			return;
		if (showNotifications && (transitionPhase === 'unmount' || transitionPhase === 'exit-done')) {
			this.setState({transitionPhase: 'mount'});
			this.transitionTimer = setTimeout(() => this.setState({transitionPhase: 'enter'}), 0);
			this.transitionTimer = setTimeout(() => this.setState({transitionPhase: 'enter-done'}), this.transitionTimeout);
			return;
		}
		if (!showNotifications && (transitionPhase === 'enter-done' || transitionPhase === 'mount' || transitionPhase === 'enter')) {
			this.setState({transitionPhase: 'exit'});
			this.transitionTimer = setTimeout(() => this.setState({transitionPhase: 'exit-done'}), this.transitionTimeout);
			this.transitionTimer = setTimeout(() => this.setState({transitionPhase: 'unmount'}), this.transitionTimeout + 50);
		}
	}

	componentWillUnmount() {
		if (this.transitionTimer)
			clearTimeout(this.transitionTimer);
		if (this.timeout)
			clearTimeout(this.timeout);
	}

	private onClickToClose = (e: React.MouseEvent, eventType: 'click' | 'contextmenu') => {
		ModuleFE_Notifications.hideAllNotifications();
		const elements = document.elementsFromPoint(e.clientX, e.clientY);
		const firstNonNotificationElement = elements.find(item => {
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
		this.setState({notifications: this.state.notifications.filter(item => item._id !== notification._id)});
	};

	private onNotificationClick = (e: React.MouseEvent, _notification: DB_Notification) => {
		stopPropagation(e);
	};

	private renderNotification(notification: DB_Notification) {
		return <div className={`ts-notification ts-notification__${notification.status}`} key={notification._id}
								onClick={e => this.onNotificationClick(e, notification)}>
			<div className={'ts-notification__header'}>
				<div className={'ts-notification__title'}>{notification.title}</div>
				<span className={'ts-notification__close'} onClick={(e) => {
					if (notification.status === 'in-progress') {
						ModuleFE_Notifications.hideAllNotifications();
						return;
					}
					this.deletePost(e, notification);
				}}>&#10005;</span>
			</div>
			<div className={'ts-notification__body'}>
				<div className={'ts-notification__message'}>{notification.message}</div>
			</div>
			<div className={'ts-notification__footer'}>
				<div className={'ts-notification__timestamp'}>{formatTimestamp('DD/M - hh:mm A', notification.__created)}</div>
			</div>
		</div>;
	}

	private renderNotifications() {
		if (!this.state.notifications.length)
			return null;
		return this.state.notifications.map(notification => this.renderNotification(notification));
	}

	render() {
		if (this.state.transitionPhase === 'unmount')
			return null;
		const className = _className('ts-notification-container', this.state.notifications.length > 1 ? 'list' : undefined);
		const overlayClass = _className('ts-notification-overlay', this.state.transitionPhase);
		return <div className={overlayClass} onClick={e => this.onClickToClose(e, 'click')}
								onContextMenu={e => this.onClickToClose(e, 'contextmenu')}
								style={{transitionDuration: `${this.transitionTimeout}ms`}}>
			<div className={className} onClick={e => this.onClickToClose(e, 'click')}
					 onContextMenu={e => this.onClickToClose(e, 'contextmenu')}
					 style={{transitionDuration: `${this.transitionTimeout}ms`}}>
				{this.renderNotifications()}
			</div>
		</div>;
	}
}
