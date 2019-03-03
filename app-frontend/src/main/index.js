/* eslint-disable import/default */
require('./js/utils');

import {React, LocalizationModule, ResourcesModule, HttpModule} from "nu-art--react-core";
import ReactDOM from 'react-dom'
import './res/styles/styles.scss';
import App from './js/ui/App';

import config from './config';

import FontsModule from './js/modules/fonts';

require.context('./res/images', true, /\.png$/);

LocalizationModule.setup(config.localization);
HttpModule.setup(config.backend);
FontsModule.setup(config.fonts);
ResourcesModule.setup();

const render = Component => {
	ReactDOM.render(
		<Component />,
		document.getElementById('app'),
	)
};

render(App);

// Webpack Hot Module Replacement API
if (module.hot) {
	module.hot.accept('./js/ui/App', () => {
		// in all other cases - re-require App manually
		render(require('./js/ui/App'))
	})
}
