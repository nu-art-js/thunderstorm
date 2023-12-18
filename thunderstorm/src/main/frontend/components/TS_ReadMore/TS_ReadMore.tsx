import * as React from 'react';
import {ComponentSync} from '../../core/ComponentSync';
import './TS_ReadMore.scss';
import {_className} from '../../utils/tools';

type Style = React.CSSProperties & {
	'--collapsed-height': string
}

type Props = {
	text: string;
	collapsedHeight: number;
	readMoreText: (showingMore: boolean) => string;
};

type State = {
	text: string;
	showMore: boolean;
	width?: number;
};

export class TS_ReadMore
	extends ComponentSync<Props, State> {

	private ref: React.RefObject<HTMLParagraphElement> = React.createRef();
	private textRef: React.RefObject<HTMLSpanElement> = React.createRef();

	static defaultProps = {
		readMoreText: (showingMore: boolean) => showingMore ? 'Read Less' : 'Read More',
	};

	protected deriveStateFromProps(nextProps: Props, state: State) {
		state.text = nextProps.text;
		state.showMore ??= false;
		return state;
	}

	componentDidMount() {
		new ResizeObserver(() => this.setState({width: this.ref.current?.scrollWidth})).observe(this.ref.current!);
		this.forceUpdate();
	}

	private getCollapsedText = () => {
		if (this.state.showMore)
			return this.state.text;

		const container = this.ref.current;
		const textContainer = this.textRef.current;
		if (!container || !textContainer)
			return this.state.text;

		const computedStyle = getComputedStyle(container);
		const width = container.clientWidth - parseFloat(computedStyle.paddingInline);
		const collapsedNumLines = this.props.collapsedHeight / parseInt(computedStyle.lineHeight);
		const charsPerLine = Math.floor(width / parseInt(computedStyle.fontSize));

		//Count text lines
		const textLines = this.state.text.split('\n').reduce((lines, curr, i) => {
			const innerLines = Math.ceil((curr.length) / charsPerLine);

			//Always push the first line
			if (i === 0) {
				lines.push({text: curr, lines: innerLines});
				return lines;
			}

			//Don't push empty strings
			if (!curr.length)
				return lines;

			//Don't push if collapsed line threshold has passed
			if (lines.reduce((total, curr) => total + curr.lines, 0) >= collapsedNumLines)
				return lines;

			//Push the text
			lines.push({text: curr, lines: innerLines});
			return lines;
		}, [] as ({ text: string, lines: number })[]);

		let text: string = '';
		const readMoreTextLength = (this.props.readMoreText(this.state.showMore).length) + 3;
		let remainingLines = collapsedNumLines;

		//Concat all lines with logic
		textLines.forEach((textLine, i) => {
			//If not last textLine, append to text with a new line char
			if (i !== textLines.length - 1) {
				text += textLine.text + '\n';
				remainingLines -= textLine.lines;
				return;
			}

			//Is last text line
			//Collect data
			const lastLineAllowedChars = charsPerLine * remainingLines * 1.75; // Actual chars allowed for this textLine  (1.75 factor to account for letters that are smaller than the font size + kerning)
			const lastLineTotalChars = textLine.text.length + readMoreTextLength + 15; // Total chars that will be in this line + the button chars + some margin for safety
			const overflowingChars = lastLineTotalChars - lastLineAllowedChars;

			//If there are overflowing chars, deduct from text
			if (overflowingChars > 0)
				text += textLine.text.substring(0, textLine.text.length - overflowingChars);
			else
				text += textLine.text;
		});

		return text;

	};

	private renderButton = () => {
		return <>
			{this.state.showMore ? ' ' : '... '}
			<span
				className={'ts-read-more__button'}
				onClick={() => this.setState({showMore: !this.state.showMore})}>
				{this.props.readMoreText(this.state.showMore)}
			</span>
		</>;
	};

	private renderText = () => {
		return <span className={'ts-read-more__text'} ref={this.textRef}>
			{this.getCollapsedText()}
		</span>;
	};

	render() {
		const style: Style = {
			'--collapsed-height': `${this.props.collapsedHeight}px`,
		};
		return <p className={_className('ts-read-more', this.state.showMore ? 'expand' : undefined)} style={style} ref={this.ref}>
			{this.renderText()}
			{this.renderButton()}
		</p>;
	}
}