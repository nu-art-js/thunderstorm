/* eslint-disable import/default */
import './res/styles/styles.scss';
import * as ReactDOM from 'react-dom';


ReactDOM.render(
	<App/>,
	document.getElementById('root')
);

const render = Component => {
	ReactDOM.render(
		<Component/>,
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
