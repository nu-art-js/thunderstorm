import {UserInputScreen} from '../login/login';
import {TestConsole_UpdatingContent} from '../updating-content/TestConsole_UpdatingContent';


const firstScreen = new TestConsole_UpdatingContent();
firstScreen.runTest();
setTimeout(() => {
	firstScreen.disable();
	new UserInputScreen().render();
}, 3000);
