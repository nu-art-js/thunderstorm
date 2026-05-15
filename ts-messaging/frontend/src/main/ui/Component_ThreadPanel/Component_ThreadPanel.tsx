import {ComponentSync} from '@nu-art/thunder-widgets';
import type {DB_Message, PaginatedMessagesResponse} from '@nu-art/ts-messaging-shared';
import {ModuleFE_Message} from '../../ModuleFE_Message.js';
import {Component_MessageList} from '../Component_MessageList/Component_MessageList.js';
import {Component_MessageInput} from '../Component_MessageInput/Component_MessageInput.js';
import './Component_ThreadPanel.scss';

type Props = {
	parentMessage: DB_Message;
	onClose?: () => void;
};

type State = {
	replies: DB_Message[];
	hasMore: boolean;
	nextCursor?: string;
	loading: boolean;
};

export class Component_ThreadPanel
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		state.replies ??= [];
		state.hasMore ??= false;
		state.loading ??= false;
		return state;
	}

	async componentDidMount() {
		await this.loadReplies();
	}

	private readonly loadReplies = async () => {
		this.setState({loading: true});
		try {
			const response: PaginatedMessagesResponse = await ModuleFE_Message.getThreadReplies(
				this.props.parentMessage.topicId,
				this.props.parentMessage._id,
				this.state.nextCursor
			);
			this.setState(prev => ({
				replies: [...response.messages.reverse(), ...prev.replies],
				hasMore: response.hasMore,
				nextCursor: response.nextCursor,
				loading: false,
			}));
		} catch (e: any) {
			this.logError('Failed to load thread replies', e);
			this.setState({loading: false});
		}
	};

	private readonly onSend = async (text: string) => {
		await ModuleFE_Message.createMessage(this.props.parentMessage.topicId, text, undefined, this.props.parentMessage._id);
		await this.loadReplies();
	};

	render() {
		const {parentMessage, onClose} = this.props;
		const {replies, hasMore} = this.state;

		return (
			<div className="ts-messaging__thread">
				<div className="ts-messaging__thread__header">
					<span>Thread</span>
					{onClose && <button className="ts-messaging__thread__close" onClick={onClose}>x</button>}
				</div>

				<div className="ts-messaging__thread__parent">
					<div className="ts-messaging__thread__parent-text">{parentMessage.text}</div>
				</div>

				<Component_MessageList messages={replies} hasMore={hasMore} onLoadMore={this.loadReplies} />
				<Component_MessageInput onSend={this.onSend} placeholder="Reply..." />
			</div>
		);
	}
}
