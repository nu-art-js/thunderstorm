import type {ChangeEvent, KeyboardEvent} from 'react';
import {ComponentSync} from '@nu-art/thunder-widgets';
import './Component_MessageInput.scss';

type Props = {
	onSend: (text: string) => void;
	placeholder?: string;
};

type State = {
	text: string;
};

export class Component_MessageInput
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		state.text ??= '';
		return state;
	}

	private readonly onChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
		this.setState({text: e.target.value});
	};

	private readonly onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			this.send();
		}
	};

	private readonly send = () => {
		const text = this.state.text.trim();
		if (!text)
			return;

		this.props.onSend(text);
		this.setState({text: ''});
	};

	render() {
		return (
			<div className="ts-messaging__input">
				<textarea
					className="ts-messaging__input__textarea"
					value={this.state.text}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					placeholder={this.props.placeholder ?? 'Type a message...'}
					rows={1}
				/>
				<button
					className="ts-messaging__input__send-btn"
					onClick={this.send}
					disabled={!this.state.text.trim()}
				>
					Send
				</button>
			</div>
		);
	}
}
