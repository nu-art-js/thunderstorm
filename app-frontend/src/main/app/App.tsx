import * as React from 'react';
import {Route, Switch} from 'react-router';
import {DragEvent} from "react";
import {Page_Home} from "./pages/Page_Home";
import {WrapperProps} from "@nu-art/fronzy";

export class App
	extends React.Component<WrapperProps> {

	public static dropBlocker<T>(ev: DragEvent<T>) {
		ev.preventDefault();
		ev.stopPropagation();
	};

	render() {
		return (
			<div onDrop={App.dropBlocker} onDragOver={App.dropBlocker}>
				<Switch>
					<Route exact path="/" component={Page_Home}/>
					<Route path="/test" component={Page_Home}/>
					<Route component={Page_Home}/>
				</Switch>
			</div>);
	}
}