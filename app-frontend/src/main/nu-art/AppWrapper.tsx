import * as React from 'react';
import {Router} from 'react-router';
import {hot} from 'react-hot-loader';
import {App} from "../app/App";
import createBrowserHistory from "history/createBrowserHistory";

const history = createBrowserHistory();

export const AppWrapper = hot(module)(() => (
	<Router history={history}>
		<App/>
	</Router>
));
