import {Button, ComponentSync} from '@nu-art/thunder-widgets';
import type {UniqueId} from '@nu-art/ts-common';
import type {DB_Message} from '@nu-art/ts-messaging-shared';
import {Component_MessageBubble, type ResolveSenderLabel} from '../Component_MessageBubble/Component_MessageBubble.js';
import './Component_MessageList.scss';

type Props = {
	messages: DB_Message[];
	hasMore: boolean;
	onLoadMore?: () => void;
	onReplyClick?: (messageId: string) => void;
	resolveSenderLabel?: ResolveSenderLabel;
	viewerAccountId?: UniqueId;
};

type State = {};

export class Component_MessageList
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		return state;
	}

	render() {
		const {messages, hasMore, onLoadMore, onReplyClick, resolveSenderLabel, viewerAccountId} = this.props;

		return (
			<div className="ts-messaging__list">
				{hasMore && onLoadMore && (
					<Button variant="text" className="ts-messaging__list__load-more" onClick={onLoadMore}>
						Load older messages
					</Button>
				)}

				{messages.map(msg => (
					<Component_MessageBubble
						key={msg._id}
						message={msg}
						onReplyClick={onReplyClick}
						resolveSenderLabel={resolveSenderLabel}
						viewerAccountId={viewerAccountId}
					/>
				))}

				{messages.length === 0 && (
					<div className="ts-messaging__list__empty">No messages yet</div>
				)}
			</div>
		);
	}
}
