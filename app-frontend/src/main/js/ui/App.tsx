/* eslint-disable import/no-named-as-default */
import {hot} from "react-hot-loader";
import {Route, Switch} from "react-router-dom";
import {Router} from 'react-router';

import {React, css, PropTypes, BaseComponent, BrowserHistoryModule} from "nu-art--react-core";

import Colors from "./styles/Colors";
import Page_Home from "./pages/Page_Home";
import LoginModule from "./../modules/LoginModule"
import NavigationBar from "./NavigationBar";

const cssBackground = css({
	position: "fixed",
	backgroundColor: Colors.LightGray,
	top: 0,
	bottom: 0,
	left: 0,
	right: 0,
});

class App
	extends BaseComponent {

	constructor(props) {
		super(props);

		this.dropBlocker = (ev) => {
			ev.preventDefault();
			ev.stopPropagation();
		};
	}

	render() {
		let history = BrowserHistoryModule.getHistory();
		return (
			<Router history={history}>
				<div>
					<div className={cssBackground} onDrop={this.dropBlocker} onDragOver={this.dropBlocker}>

						<Switch>
							<Route exact path="/" component={Page_Home}/>
							<Route component={Page_Home}/>
						</Switch>
					</div>
					<NavigationBar/>
				</div>
			</Router>
		);
	}
}

App.propTypes = {
	children: PropTypes.element
};

export default hot(module)(App);
