import  {React, css, PropTypes, BaseComponent}  from '../defaults';

const inputFieldContainer = css`
  align-items: center;
  width: 100%;
  label: input-field-container;
`;

const inputFieldLabel = css`
  margin-right: 10px;
  label: input-field-label;
`;

class InputTextField
	extends BaseComponent {
	constructor(props) {
		super(props);

		this.onValueChanged = this.onValueChanged.bind(this);

		this.state = {
			error: null,
			value: props.value || ""
		};
	}

	onValueChanged(evt) {
		let value = evt.target.value;
		this.props.onChange && this.props.onChange(value, this.props.id);
		this.setState(() => {
			return {value: value}
		});
	}

	validateValue() {
		if (!this.props.validateValue)
			return true;
		let value = this.state.value + "";

		if (!this.props.validateValue)
			return true;

		let errorMessage = this.props.validateValue(value, this.props.id);

		this.setState(() => {
			return {error: errorMessage}
		});
		return !errorMessage;

	}

	onFocusLost() {
		if (!this.props.onFocusLost)
			return;

		this.props.onFocusLost(this.state.value, this.props.id);
	}

	render() {
		return (
			<div className={inputFieldContainer}>
				{this.props.label ? <div className={inputFieldLabel}>{this.props.label}</div> : "" }

				<input
					value={this.props.value}
					className={this.props.className || ""}
					onChange={this.onValueChanged}
					id={this.props.id}
					label={this.props.label}
					type={this.props.type}
					placeholder={this.props.placeholder}
					onKeyPress={this.props.onKeyPress}
					autoComplete={this.props.autoComplete}
					onBlur={() => {
						if (this.validateValue())
							this.onFocusLost();
					}}
				/>

				<div className={this.state.error ? "form-error-message-on" : "form-error-message-off"}>
					{this.state.error}</div>
			</div>
		);
	}
}

InputTextField.propTypes = {
	label: PropTypes.string,
	value: PropTypes.any,
	onChange: PropTypes.func,
	validateValue: PropTypes.func,
	onFocusLost: PropTypes.func,
};

export default InputTextField;
