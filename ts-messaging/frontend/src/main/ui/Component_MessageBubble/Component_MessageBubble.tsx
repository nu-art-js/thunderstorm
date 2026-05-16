import {ComponentSync} from '@nu-art/thunder-widgets';
import type {DB_Message} from '@nu-art/ts-messaging-shared';
import './Component_MessageBubble.scss';

type Props = {
	message: DB_Message;
	onReplyClick?: (messageId: string) => void;
};

type State = {};

export class Component_MessageBubble
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		return state;
	}

	private readonly onReply = () => {
		this.props.onReplyClick?.(this.props.message._id);
	};

	render() {
		const {message} = this.props;
		const timestamp = message.__created ? new Date(message.__created).toLocaleTimeString() : '';

		return (
			<div className="ts-messaging__bubble">
				<div className="ts-messaging__bubble__header">
					<span className="ts-messaging__bubble__sender">{message._auditorId}</span>
					<span className="ts-messaging__bubble__time">{timestamp}</span>
				</div>

				{message.text && <div className="ts-messaging__bubble__text">{message.text}</div>}

				{message.attachments && message.attachments.length > 0 && (
					<div className="ts-messaging__bubble__attachments">
						{message.attachments.map(ref => (
							<span key={ref.assetId} className="ts-messaging__bubble__attachment">{ref.assetId}</span>
						))}
					</div>
				)}

				{this.props.onReplyClick && (
					<button className="ts-messaging__bubble__reply-btn" onClick={this.onReply}>Reply</button>
				)}
			</div>
		);
	}
}
