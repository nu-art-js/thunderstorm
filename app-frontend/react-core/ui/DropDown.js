import React, {Component} from 'react';
import PropTypes from 'prop-types';
import {css} from 'emotion';

const wrapper = css({
	display: "inline-block"
});

const header = css({
	display: "flex",
	alignItems: "center",
});

const arrowExpanded = css({
	marginLeft: "16px",
	width: "16px",
	height: "16px",
});

const arrowCollapsed = css(arrowExpanded, {
	transform: "rotate(180deg)",
});

const list = css({
	marginTop: "8px",
	position: "fixed",
	display: "inline-block",
	label: "drop-down-list",
	zIndex: "10",
	overflowY: "scroll hidden"
});

const listItem = css({
	display: "flex",
	alignItems: "center",
	padding: "3px",
	label: "drop-down-item",
});

class DropDown
	extends Component {
	constructor(props) {
		super(props);

		this.state = {
			isOpen: false,
			selected: this.props.selected
		};
	}

	handleClickOutside() {
		this.setState({
			isOpen: false
		})
	}

	toggleList(e, selected) {
		e.stopPropagation();
		e.preventDefault();

		this.setState(prevState => {
			const newOpenState = !prevState.isOpen;
			return {
				isOpen: newOpenState,
				selected: selected || prevState.selected
			}
		});
	}

	onSelected(item, e) {
		this.toggleList(e, item);
		this.props.onSelected(item, this.props.id);
	}

	render() {
		const items = this.props.items;
		const Renderer = this.props.renderer;

		let listStyle = this.props.listStyle;
		return (
			<div className={wrapper} onClick={this.toggleList.bind(this)}>
				<div className={header}>
					{this.state.selected ? <Renderer item={this.state.selected}/> : <div>{this.props.title}</div>}
					<img className={this.state.isOpen ? arrowExpanded : arrowCollapsed} src='res/images/icon__arrow_up.png'/>
				</div>

				{!this.state.isOpen ? "" : <div className={list}>
					<div className={listStyle}>
						{items.map((item, index) => (
							<div className={listItem} key={index} onClick={this.onSelected.bind(this, item)}>
								<Renderer item={item}/>
							</div>
						))}
					</div>
				</div>}
			</div>)
	}
}

DropDown.propTypes = {
	id: PropTypes.string,
	items: PropTypes.any,
	renderer: PropTypes.any,
	onSelected: PropTypes.func,
	title: PropTypes.string,
	listStyle: PropTypes.string,
	selected: PropTypes.any,
};

export default DropDown;
