import {ComponentSync} from '@nu-art/thunder-widgets';
import type {DB_Message} from '@nu-art/ts-messaging-shared';
import {Component_MessageBubble} from '../Component_MessageBubble/Component_MessageBubble.js';
import './Component_MessageList.scss';

type Props = {
	messages: DB_Message[];
	hasMore: boolean;
	onLoadMore?: () => void;
	onReplyClick?: (messageId: string) => void;
};

type State = {};

export class Component_MessageList
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		return state;
	}

	render() {
		const {messages, hasMore, onLoadMore, onReplyClick} = this.props;

		return (
			<div className="ts-messaging__list">
				{hasMore && onLoadMore && (
					<button className="ts-messaging__list__load-more" onClick={onLoadMore}>
						Load older messages
					</button>
				)}

				{messages.map(msg => (
					<Component_MessageBubble
						key={msg._id}
						message={msg}
						onReplyClick={onReplyClick}
					/>
				))}

				{messages.length === 0 && (
					<div className="ts-messaging__list__empty">No messages yet</div>
				)}
			</div>
		);
	}
}
