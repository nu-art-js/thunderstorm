import type {KeyboardEvent} from 'react';
import {Button, ComponentSync, LL_H_C, TS_TextArea} from '@nu-art/thunder-widgets';
import './Component_MessageInput.scss';

type Props = {
	onSend: (text: string) => void | Promise<void>;
	placeholder?: string;
	inputId?: string;
};

type State = {
	text: string;
	sending?: boolean;
};

export class Component_MessageInput
	extends ComponentSync<Props, State> {

	protected deriveStateFromProps(_nextProps: Props, state: State): State {
		state.text ??= '';
		return state;
	}

	private readonly onChange = (value: string) => {
		this.setState({text: value});
	};

	private readonly onKeyDown = (e: KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			void this.send();
		}
	};

	private readonly send = async () => {
		const text = this.state.text.trim();
		if (!text || this.state.sending)
			return;

		this.setState({sending: true});
		try {
			await this.props.onSend(text);
			this.setState({text: '', sending: false});
		} catch {
			this.setState({sending: false});
		}
	};

	render() {
		const {text, sending} = this.state;

		return (
			<LL_H_C className="ts-messaging__input">
				<TS_TextArea
					id={this.props.inputId ?? 'ts-messaging-composer'}
					className="ts-messaging__input__textarea"
					value={text}
					onChange={this.onChange}
					onKeyDown={this.onKeyDown}
					placeholder={this.props.placeholder ?? 'Type a message'}
				/>
				<Button
					variant="primary"
					disabled={!text.trim() || !!sending}
					actionInProgress={!!sending}
					onClick={this.send}>
					Send
				</Button>
			</LL_H_C>
		);
	}
}
