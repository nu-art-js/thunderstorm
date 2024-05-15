import {TestConsole_UpdatingContent} from './TestConsole_UpdatingContent';

// Example usage
const screen = new TestConsole_UpdatingContent();
let content = '';
let index = 1;
for (const char of 'Hello, world!\nLovely weather today...') {
	setTimeout(() => {
		screen.setState({content: content += char});
	}, 200 * index++);
}
