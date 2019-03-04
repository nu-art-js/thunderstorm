import {React, css, BaseComponent, PropTypes} from '../defaults';
import {SketchPicker} from 'react-color'
const style_container = css({
	padding: '4px',
	display: "flex",
	alignItems: "center",
	background: '#fff',
	borderRadius: '1px',
	boxShadow: '0 0 0 1px rgba(0,0,0,.1)',
	cursor: 'pointer',
	label: 'color-picker-container',
});

const style_popover = css({
	position: 'absolute',
	zIndex: '2',
});
const arrowExpanded = css({
	marginLeft: "4px",
	width: "16px",
	height: "16px",
});

const arrowCollapsed = css(arrowExpanded, {
	transform: "rotate(180deg)",
});

const style_cover = css({
	position: 'fixed',
	top: '0px',
	right: '0px',
	bottom: '0px',
	left: '0px',
});

class ColorPicker
	extends BaseComponent {

	constructor(props) {
		super(props);
		this.onClose = this.onClose.bind(this);
		this.onChange = this.onChange.bind(this);
		this.onClick = this.onClick.bind(this);

		this.state = {
			displayColorPicker: false,
		}
	}

	static getDerivedStateFromProps(props, state) {
		if (props.color === state.id)
			return null;

		return {
			id: props.color,
			color: props.color,
		};
	}

	onClick() {
		this.setState({displayColorPicker: !this.state.displayColorPicker})
	};

	onClose() {
		this.setState({displayColorPicker: false})
	};

	onChange(color) {
		this.props.onColorChanged(color.rgb, this.props.id);
		this.setState({color: color.rgb});
	};

	render() {
		const style_color = css({
			width: "40px",
			height: "20px",
			borderRadius: '2px',
			background: `rgba(${ this.state.color.r }, ${ this.state.color.g }, ${ this.state.color.b }, ${ this.state.color.a })`,
			label: 'color-picker-color',
		});

		return (
			<div>
				<div className={style_container} onClick={this.onClick}>
					<div className={style_color}/>
					<img className={this.state.displayColorPicker ? arrowExpanded : arrowCollapsed} src={this.getImageUrl('icon__arrow_up')}/>
				</div>

				{this.state.displayColorPicker ? <div className={style_popover}>
					<div className={style_cover} onClick={this.onClose}/>
					<SketchPicker color={this.state.color} onChange={this.onChange}/>
				</div> : ""}
			</div>
		)
	}
}

ColorPicker.propTypes = {
	onColorChanged: PropTypes.func,
	color: PropTypes.object,
	id: PropTypes.any,
};

export default ColorPicker
