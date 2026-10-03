import {ComponentSync} from '@nu-art/thunder-widgets';
import type {DB_Message} from '@nu-art/ts-messaging-shared';
import type {UniqueId} from '@nu-art/ts-common';
import {ModuleFE_Message, type OnMessagesUpdated} from '../../ModuleFE_Message.js';
import {Component_MessageList} from '../Component_MessageList/Component_MessageList.js';
import {Component_MessageInput} from '../Component_MessageInput/Component_MessageInput.js';
import {Component_ThreadPanel} from '../Component_ThreadPanel/Component_ThreadPanel.js';
import type {ResolveSenderLabel} from '../Component_MessageBubble/Component_MessageBubble.js';
import {resolveCachedTopicQuery} from './resolve-cached-topic-query.js';
import './Component_ChatPanel.scss';

type Props = {
	topicId: UniqueId;
	resolveSenderLabel?: ResolveSenderLabel;
	viewerAccountId?: UniqueId;
	enableThreads?: boolean;
};

type State = {
	hasMore: boolean;
	nextCursor?: string;
	threadMessage?: DB_Message;
	error?: string;
};

export class Component_ChatPanel
	extends ComponentSync<Props, State>
	implements OnMessagesUpdated {

	__onMessagesUpdated = () => this.forceUpdate();

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		state.hasMore ??= false;
		return state;
	}

	async componentDidMount() {
		await this.fillCache();
	}

	private readonly fillCache = async () => {
		const cached = ModuleFE_Message.listTopicMessages(this.props.topicId);
		const plan = resolveCachedTopicQuery(cached, this.state.nextCursor);
		if (plan.skipQuery) {
			this.logInfo('chat-panel: skip messages/query — cache already has messages', {
				topicId: this.props.topicId,
				cached: cached.length,
			});
			if ('nextCursor' in plan)
				this.setState({hasMore: plan.hasMore, nextCursor: plan.nextCursor, error: undefined});
			return;
		}

		this.logInfo('chat-panel: fetch messages/query', {
			topicId: this.props.topicId,
			cursor: this.state.nextCursor,
			cached: cached.length,
		});
		try {
			const response = await ModuleFE_Message.getMessagesForTopic({
				topicId: this.props.topicId,
				cursor: this.state.nextCursor,
			});
			this.setState({
				hasMore: response.hasMore,
				nextCursor: response.nextCursor,
				error: undefined,
			});
		} catch (e: any) {
			this.logError('chat-panel: messages/query failed', e);
			// Cache + live sync still render the thread if the paginated query is scoped out.
		}
	};

	private readonly onSend = async (text: string) => {
		await ModuleFE_Message.createMessage(this.props.topicId, text);
	};

	private readonly onReplyClick = (messageId: string) => {
		const message = ModuleFE_Message.listTopicMessages(this.props.topicId).find(m => m._id === messageId);
		if (message)
			this.setState({threadMessage: message});
	};

	private readonly closeThread = () => {
		this.setState({threadMessage: undefined});
	};

	render() {
		const {hasMore, threadMessage} = this.state;
		const {resolveSenderLabel, viewerAccountId} = this.props;
		const messages = ModuleFE_Message.listTopicMessages(this.props.topicId);

		return (
			<div className="ts-messaging__chat-panel">
				<div className="ts-messaging__chat-panel__main">
					<Component_MessageList
						messages={messages}
						hasMore={hasMore}
						onLoadMore={this.fillCache}
						onReplyClick={this.props.enableThreads === false ? undefined : this.onReplyClick}
						resolveSenderLabel={resolveSenderLabel}
						viewerAccountId={viewerAccountId}
					/>
					<Component_MessageInput onSend={this.onSend} inputId="ts-messaging-composer"/>
				</div>

				{threadMessage && (
					<div className="ts-messaging__chat-panel__thread">
						<Component_ThreadPanel
							parentMessage={threadMessage}
							onClose={this.closeThread}
							resolveSenderLabel={resolveSenderLabel}
							viewerAccountId={viewerAccountId}
						/>
					</div>
				)}
			</div>
		);
	}
}
