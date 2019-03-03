import {React, css, PropTypes} from '../defaults';

const style_container = css({
	position: "relative",
	cursor: 'pointer',
	margin: "6px",
	width: '100%',
});

const style_bg = css({
	position: "absolute",
	width: '100%',
	borderRadius: "2px",
	height: '4px',
});

const style_centerVertically = css({
	marginTop: "auto",
	top: "0px",
	marginBottom: "auto",
	bottom: "0px"
});

const style_progress = css({
	pointerEvents: 'none',
	transformOrigin: 'left',
});

const style_thumb = css({
	position: 'absolute',
	width: '10px',
	height: '10px',
	marginLeft: "-5px",
	pointerEvents: 'none',
	borderRadius: '50%',
});

class Slider
	extends React.Component {

	static normalizeProgress(props) {
		let progress = props.progress;

		if (progress === undefined || progress === null)
			progress = 10;

		if (progress < props.min)
			progress = props.min;

		if (progress > props.max)
			progress = props.max;

		return progress / (props.max - props.min);
	}

	static getDerivedStateFromProps(props, prevState) {
		if (prevState && props.id === prevState.id)
			return null;

		return {
			id: props.id,
			progress: Slider.normalizeProgress(props),
			hover: false,
			active: false,
		}
	}

	constructor(props) {
		super(props);
		this.onValueChanged = this.onValueChanged.bind(this);
		this.onMouseLeave = this.onMouseLeave.bind(this);
		this.onMouseEnter = this.onMouseEnter.bind(this);
		this.onMouseDown = this.onMouseDown.bind(this);
		this.onMouseMove = this.onMouseMove.bind(this);
		this.onMouseUp = this.onMouseUp.bind(this);
	}

	round(value) {
		const inv = 1.0 / this.props.step;
		return Math.round(value * inv) / inv;
	}

	componentDidMount() {
		this.forceUpdate();
	}

	componentWillUnmount() {
		this.removeListeners();
	}

	addListeners() {
		this.removeListeners();

		document.addEventListener('mousemove', this.onMouseMove);
		document.addEventListener('mouseup', this.onMouseUp);
	}

	removeListeners() {
		document.removeEventListener('mousemove', this.onMouseMove);
		document.removeEventListener('mouseup', this.onMouseUp);
	}

	onValueChanged(progress) {
		const progressValue = this.round(this.props.min + progress * (this.props.max - this.props.min));
		if (this.progressValue === progressValue)
			return;

		console.log(`progressValue: ${progressValue}`)
		this.progressValue = progressValue;
		this.props.onChange && this.props.onChange(progressValue, this.props.id);
	}

	onMouseUp() {
		this.removeListeners();

		this.setState({active: false});
		this.onValueChanged(this.state.progress);
	};

	onMouseMove(e) {
		e.stopPropagation();
		e.preventDefault();

		this.calcProgress(e.clientX);
	};

	onMouseDown(e) {
		if (e.button !== 0)
			return;

		e.stopPropagation();
		e.preventDefault();

		this.initX = e.clientX - e.nativeEvent.offsetX;
		this.calcProgress(e.clientX);
		this.addListeners();
	};

	calcProgress(x) {
		console.log(`clientX: ${x}`);

		let progress = (x - this.initX) / this._container.clientWidth;
		if (progress < 0)
			progress = 0;

		if (progress > 1)
			progress = 1;

		this.setState(() => ({
			progress: progress,
			active: true
		}));

		this.onValueChanged(progress);
	}

	onMouseEnter() {
		this.setState({hover: true});
	};

	onMouseLeave() {
		this.setState({hover: false});
	};

	render() {
		return (
			<div
				className={style_container}
				onMouseEnter={this.onMouseEnter}
				onMouseLeave={this.onMouseLeave}
				onMouseDown={this.onMouseDown}
				style={{opacity: this.state.hover || this.state.active ? 1 : 0.8,}}
				ref={(ref) => this._container = ref}>
				{this.renderBackground()}
				{this.renderProgress()}
				{this.renderThumb()}
			</div>
		);
	}

	renderBackground() {
		if (!this._container)
			return "";

		const backgroundColor = this.props.backgroundColor;
		return <div className={`${style_centerVertically} ${style_bg}`} style={{
			backgroundColor: backgroundColor,
		}}/>;
	}

	renderProgress() {
		if (!this._container)
			return "";

		const progress = this.state.progress * this._container.clientWidth;

		return <div className={`${style_centerVertically} ${style_bg} ${style_progress}`}
								style={{
									width: `${progress}px`,
									backgroundColor: this.props.progressColor,
								}}/>;
	}

	renderThumb() {
		if (!this._container)
			return "";

		const progress = this.state.progress * this._container.clientWidth;

		return <div
			className={`${style_centerVertically} ${style_thumb}`}
			style={{
				transform: `translateX(${progress}px)`,
				backgroundColor: this.props.thumbColor,
			}}
		/>;
	}
}

Slider.defaultProps = {
	step: 0.5,
	min: 0,
	progress: 10,
	max: 100,
	backgroundColor: '#C8C8C8',
	progressColor: '#9a6f6f',
	thumbColor: '#9a3f3f',
};

Slider.propTypes = {
	onChange: PropTypes.func,
	step: PropTypes.number,
	min: PropTypes.number,
	progress: PropTypes.number,
	max: PropTypes.number,
	progressColor: PropTypes.string,
	backgroundColor: PropTypes.string,
	thumbColor: PropTypes.string,
	style: PropTypes.object,
};

export default Slider;
