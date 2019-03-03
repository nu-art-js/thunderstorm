/* eslint-disable import/no-named-as-default */
import {React, PropTypes, css, BaseComponent, BrowserHistoryModule, LocalizationModule} from "nu-art--react-core";
import LoginModule from "../modules/LoginModule";
import Colors from "./styles/Colors";

const Renderer_Link = (props) => {
	const item = props.item;

	function isSelected(item) {
		let url = BaseComponent.getUrl();
		return url === item.path
	}

	return (
		<div className={`${hoverCSS} clickable`}
				 style={{
					 color: isSelected(item) ? 'blue' : Colors.DarkGray
				 }}
				 key={item.path}
				 onClick={(e) => item.onClick(e, item)}>
			{LocalizationModule.getString(item.label)}
		</div>
	);
};

let onClick = (e, item) => {
	BrowserHistoryModule.setUrl(item.path);
};

const options = [
	{
		path: "/",
		label: "Text_Home",
		renderer: Renderer_Link,
		onClick: onClick
	},
	{
		path: "/about",
		label: "Text_About",
		renderer: Renderer_Link,
		onClick: onClick
	},
	{
		path: "/playground",
		label: "PlayGround",
		renderer: Renderer_Link,
		onClick: onClick
	},
	{
		path: "/logout",
		label: "Text_Logout",
		renderer: Renderer_Link,
		filter: () => {
			return LoginModule.isLoggedIn();
		},
		onClick: (e) => {
			LoginModule.logout(() => {
				BrowserHistoryModule.setUrl("/");
			});
		}
	},
	{
		path: "/page/list",
		label: "Text_Pages",
		renderer: Renderer_Link,
		filter: () => {
			return LoginModule.isLoggedIn();
		},
		onClick: (e) => {
			BrowserHistoryModule.setUrl("/pages/list");
		}
	},
];

let MenuContentStyle = {
	"minWidth": "230px",
	"minHeight": "50px",
	"maxWidth": "650px",
	"justifyContent": "space-evenly"
};

const hoverCSS = css({
	'&:hover': {
		background: 'lightblue'
	},
	fontFamily: "font-light",
	fontSize: "25px",
});

class NavigationBar
	extends BaseComponent {

	constructor(props) {
		super(props);
	}

	render() {
		return (
			<div className="match_width ll_h_c" style={{
				height: "50px",
				marginTop: "16px",
				paddingLeft: "16px",
				paddingRight: "16px",
				boxSizing: "border-box",
				right: "0",
				left: "0",
				position: "fixed",
				top: "0",
			}}>
				<img src="/images/icon__add.png"/>
				<div style={{flexGrow: "1"}}>
					<div className="center_h ll_h_c" style={MenuContentStyle}>
						{options.filter(item => !item.filter || item.filter(item)).map((option, index) => NavigationBar.renderItem(option, index))}
					</div>
				</div>
			</div>
		);
	}

	static renderItem(item, index) {
		const Renderer = item.renderer;
		return (<Renderer key={index} item={item}/>)
	}
}

export default NavigationBar;
