import {React, css, BaseComponent, PropTypes} from '../defaults';

const renderer_wrapper = css`
  display: flex;
  align-items: center;
`;

const checkbox = css`
  width: 16px;
  height: 16px;
  margin-right: 8px;
`;

const uncheckedStyle = css`
  ${checkbox}

  background-color: lightcoral;
  label: checkbox-not-selected;
`;

const checkedStyle = css`
  ${checkbox}

  background-color: lightgreen;
  label: checkbox-selected;
`;

class DefaultRenderer
	extends BaseComponent {

	render() {
		return (
			<div className={renderer_wrapper}>
				<div className={this.props.checked ? checkedStyle : uncheckedStyle}/>
				{this.props.label}
			</div>
		);
	}
}

class Checkbox
	extends BaseComponent {
	constructor(props) {
		super(props);

		this.toggle = this.toggle.bind(this);
	}

	static getDerivedStateFromProps(props) {
		return {
			checked: props.checked,
			renderer: props.renderer || DefaultRenderer
		};
	}

	toggle() {
		const checked = !this.state.checked;

		this.setState((prev) => {
			return {
				checked: checked
			}
		});

		this.props.onCheckChanged && this.props.onCheckChanged(checked, this.props.id);
	}

	render() {
		const Renderer = this.state.renderer;

		return (
			<div className={this.props.style} onClick={this.toggle}>
				<Renderer label={this.props.label} imagePath={this.props.imagePath} checked={this.state.checked} rotate={this.props.rotate}/>
			</div>);
	}
}

Checkbox.propTypes = {
	checked: PropTypes.bool,
	label: PropTypes.string,
	imagePath: PropTypes.string,
	style: PropTypes.string,
	renderer: PropTypes.any,
	onCheckChanged: PropTypes.func,
};

export default Checkbox;

