import * as React from 'react';
import {ComponentSync} from '../../core';
import './TS_ReadMore.scss';

type Style = React.CSSProperties & { '--collapsed-height': string }

type Props = {
	text: string;
	collapsedHeight: number;
	readMoreText: (showingMore: boolean) => string;
};

type State = {
	text: string;
	showMore: boolean;
};

export class TS_ReadMore extends ComponentSync<Props, State> {

	private ref: React.RefObject<HTMLParagraphElement> = React.createRef();

	static defaultProps = {
		readMoreText: (showingMore: boolean) => showingMore ? 'Read Less' : 'Read More',
	};

	protected deriveStateFromProps(nextProps: Props, state?: State): State {
		state ??= this.state ? {...this.state} : {} as State;
		state.text = nextProps.text;
		state.showMore ??= false;
		return state;
	}

	componentDidUpdate() {
		this.fixText();
	}

	componentDidMount() {
		this.fixText();
	}

	private fixText() {
		const text = this.ref.current!.innerText;
		console.log(text);
	}

	private renderButton = () => {
		if (this.state.text.length <= 1)
			return '';

		return <>
			{this.state.showMore ? ' ' : '... '}
			<span
				className={'ts-read-more__button'}
				onClick={() => this.setState({showMore: !this.state.showMore})}>
				{this.props.readMoreText(this.state.showMore)}
			</span>
		</>;
	};

	render() {
		const style: Style = {'--collapsed-height': `${this.props.collapsedHeight}px`};
		return <p className={'ts-read-more'} style={style} ref={this.ref}>
			{this.state.text}
			{/*<span className={'ts-read-more__text'}>{this.state.text}</span>*/}
			{this.renderButton()}
		</p>;
	}
}
