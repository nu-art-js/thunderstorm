import {UserInputScreen} from '../login/login';
import {TestConsole_UpdatingContent} from '../updating-content/TestConsole_UpdatingContent';


const firstScreen = new UserInputScreen().create();
setTimeout(() => {
	firstScreen.dispose();
	new TestConsole_UpdatingContent().create().runTest();
}, 3000);
