import {React, BaseComponent, css, PropTypes} from '../defaults';

class TreeNode
	extends BaseComponent {

	constructor(props) {
		super(props);
		this.toggleExpanded = this.toggleExpanded.bind(this);
		this.state = {expanded: this.props.expanded};
	}

	toggleExpanded() {
		this.setState(() => {
			return {
				expanded: !this.state.expanded || false
			};
		})
	}

	renderNodes(items) {
		return items.map((item, index) => {
			const Renderer = this.props.renderer;
			return <Renderer renderer={this.props.renderer} parent={this.props.item} item={item} key={index} isLast={index === items.length - 1}
											 onClick={this.props.onClick}/>
		})
	}
}

TreeNode.propTypes = {
	onClick: PropTypes.func,
	item: PropTypes.any
};

export default TreeNode;

