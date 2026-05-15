import {ComponentSync} from '@nu-art/thunder-widgets';
import type {DB_Message, PaginatedMessagesResponse} from '@nu-art/ts-messaging-shared';
import type {UniqueId} from '@nu-art/ts-common';
import {ModuleFE_Message} from '../../ModuleFE_Message.js';
import {Component_MessageList} from '../Component_MessageList/Component_MessageList.js';
import {Component_MessageInput} from '../Component_MessageInput/Component_MessageInput.js';
import {Component_ThreadPanel} from '../Component_ThreadPanel/Component_ThreadPanel.js';
import './Component_ChatPanel.scss';

type Props = {
	topicId: UniqueId;
};

type State = {
	messages: DB_Message[];
	hasMore: boolean;
	nextCursor?: string;
	threadMessage?: DB_Message;
	loading: boolean;
};

export class Component_ChatPanel
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		state.messages ??= [];
		state.hasMore ??= false;
		state.loading ??= false;
		return state;
	}

	async componentDidMount() {
		await this.loadMessages();
	}

	private readonly loadMessages = async () => {
		this.setState({loading: true});
		try {
			const response: PaginatedMessagesResponse = await ModuleFE_Message.getMessagesForTopic({
				topicId: this.props.topicId,
				cursor: this.state.nextCursor,
			});
			this.setState(prev => ({
				messages: [...response.messages.reverse(), ...prev.messages],
				hasMore: response.hasMore,
				nextCursor: response.nextCursor,
				loading: false,
			}));
		} catch (e: any) {
			this.logError('Failed to load messages', e);
			this.setState({loading: false});
		}
	};

	private readonly onSend = async (text: string) => {
		await ModuleFE_Message.createMessage(this.props.topicId, text);
		await this.loadMessages();
	};

	private readonly onReplyClick = (messageId: string) => {
		const message = this.state.messages.find(m => m._id === messageId);
		if (message)
			this.setState({threadMessage: message});
	};

	private readonly closeThread = () => {
		this.setState({threadMessage: undefined});
	};

	render() {
		const {messages, hasMore, threadMessage} = this.state;

		return (
			<div className="ts-messaging__chat-panel">
				<div className="ts-messaging__chat-panel__main">
					<Component_MessageList
						messages={messages}
						hasMore={hasMore}
						onLoadMore={this.loadMessages}
						onReplyClick={this.onReplyClick}
					/>
					<Component_MessageInput onSend={this.onSend} />
				</div>

				{threadMessage && (
					<div className="ts-messaging__chat-panel__thread">
						<Component_ThreadPanel parentMessage={threadMessage} onClose={this.closeThread} />
					</div>
				)}
			</div>
		);
	}
}
