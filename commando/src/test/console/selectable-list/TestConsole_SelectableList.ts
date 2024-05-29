import {ConsoleScreen} from '../../../main/console/ConsoleScreen';
import {Widgets} from 'blessed';
import {BlessedWidget} from '../../../main/console/types';


interface ListItem {
	label: string;
	value: number;
}

interface ListScreenState {
	items: ListItem[];
	selectedItem: ListItem | null;
	logs: string;
}

export class TestConsole_SelectableList
	extends ConsoleScreen<ListScreenState> {
	private listElement!: BlessedWidget['listTable'];
	private valueDisplay!: BlessedWidget['text'];

	constructor() {
		super(
			{
				smartCSR: true,
				title: 'List and Value Display',
			},
			[
				{
					keys: ['C-c'], // Exit on Control-C
					callback: () => process.exit(0),
				},
			]
		);

		this.state = {
			items: [
				{label: 'Item 1', value: 10},
				{label: 'Item 2', value: 20},
				{label: 'Item 3', value: 30},
			],
			selectedItem: null,
			logs: '',
		};
	}

	protected createContent() {
		this.listElement = this.createWidget('listTable', {
			top: '0',
			left: '0',
			width: '50%',
			height: '100%',
			label: ' Items ',
			border: {type: 'line'},
			keys: true,
			vi: true,
			mouse: true,
			itemBold: true,
			style: {

				selected: {
					bg: 'blue',
				},
				item: {
					hover: {
						bg: 'blue',
						fg: 'white',
					},
				},
			},
			data: this.state.items.map(item => [`${this.state.selectedItem === item ? '* ' : '  '}${item.label}`]),
		});

		this.listElement.on('select', (item: Widgets.BlessedElement, index: number) => {
			const log = `event "select" - index: ${index}, content: ${item.content}`;
			this.listElement.setData(this.state.items.map((item, _index) => [`${index === _index ? '* ' : ''}${item.label}`]));
			this.valueDisplay.setContent(`${this.valueDisplay.content}\n${log}`);
			this.container.render();
		});
		this.listElement.on('select item', (item: Widgets.BlessedElement, index: number) => {
			const log = `event "select item" - index: ${index}, content: ${item.content}`;
			this.valueDisplay.setContent(`${this.valueDisplay.content}\n${log}`);
			this.container.render();
		});
		this.listElement.on('action', (item: Widgets.BlessedElement, index: number) => {
			const log = `event "action" - index: ${index}, content: ${item.content}`;
			this.valueDisplay.setContent(`${this.valueDisplay.content}\n${log}`);
			this.container.render();
		});
		this.listElement.on('add item', (item: Widgets.BlessedElement, index: number) => {
			const log = `event "add item" - index: ${index}, content: ${item?.content}`;
			this.valueDisplay.setContent(`${this.valueDisplay.content}\n${log}`);
			this.container.render();
		});
		this.listElement.on('cancel', (item: Widgets.BlessedElement, index: number) => {
			const log = `event "cancel" - index: ${index}, content: ${item.content}`;
			this.valueDisplay.setContent(`${this.valueDisplay.content}\n${log}`);
			this.container.render();
		});
		this.listElement.on('click', (item: Widgets.BlessedElement, index: number) => {
			const log = `event "cancel" - index: ${index}, content: ${item.content}`;
			this.valueDisplay.setContent(`${this.valueDisplay.content}\n${log}`);
			this.container.render();
		});

		this.valueDisplay = this.createWidget('text', {
			top: '0',
			left: '50%',
			width: '50%',
			height: '100%',
			label: ' Logs ',
			border: {type: 'line'},
			content: 'Select an item from the list',
		}) as Widgets.TextElement;
	}

	protected render(): void {

		if (this.state.selectedItem) {
			this.listElement.setLabel(`Items - Selected Value: ${this.state.selectedItem.value}`);
		} else {
			this.listElement.setContent('Items - Select an item from the list');
		}

		this.valueDisplay.setContent(this.state.logs);
	}
}
