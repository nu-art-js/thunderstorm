/*
 * Thunder Widgets – Test entry for Playwright.
 * Renders Input, Checkbox, CollapsableContainer, Label, Link, Printable, Layouts, CheckboxGroup, Button v1/v3 for the same-scenario test suites.
 */
import * as React from 'react';
import {createRoot} from 'react-dom/client';
import {TS_Input as TS_InputV1} from '../main/input/v1/index.js';
import {TS_Input as TS_InputFromV2} from '../main/input/v2/index.js';
import {TS_Input as TS_InputFromV3} from '../main/input/v3/index.js';
import {TS_Checkbox} from '../main/checkbox/v1/index.js';
import {TS_Checkbox as TS_CheckboxFromV2} from '../main/checkbox/v2/index.js';
import {TS_Checkbox as TS_CheckboxFromV3} from '../main/checkbox/v3/index.js';
import {TS_CollapsableContainer} from '../main/collapsable-container/v1/index.js';
import {TS_CollapsableContainer as TS_CollapsableContainerFromV2} from '../main/collapsable-container/v2/index.js';
import {TS_CollapsableContainer as TS_CollapsableContainerFromV3} from '../main/collapsable-container/v3/index.js';
import {Label as LabelV1} from '../main/label/v1/index.js';
import {Label as LabelV3} from '../main/label/v3/index.js';
import {TS_Link as TS_LinkV1} from '../main/link/v1/index.js';
import {TS_Link as TS_LinkV3} from '../main/link/v3/index.js';
import {TS_Printable as TS_PrintableV1} from '../main/printable/v1/index.js';
import {TS_Printable as TS_PrintableV3} from '../main/printable/v3/index.js';
import {LL_V_L as LL_V_L_V1} from '../main/layouts/v1/index.js';
import {LL_V_L as LL_V_L_V3} from '../main/layouts/v3/index.js';
import {TS_CheckboxGroup as TS_CheckboxGroupV1} from '../main/checkbox-group/v1/index.js';
import {TS_CheckboxGroup as TS_CheckboxGroupV3} from '../main/checkbox-group/v3/index.js';
import {Button as ButtonV1} from '../main/button/v1/index.js';
import {Button as ButtonV3} from '../main/button/v3/index.js';
import {TS_ComponentTransition as TS_ComponentTransitionV1} from '../main/component-transition/v1/index.js';
import {TS_ComponentTransition as TS_ComponentTransitionV3} from '../main/component-transition/v3/index.js';
import {TS_CopyToClipboard} from '../main/copy-to-clipboard/v1/index.js';
import {TS_Toggle as TS_ToggleV1} from '../main/toggle/v1/index.js';
import {TS_Toggle as TS_ToggleV3} from '../main/toggle/v3/index.js';
import {TS_Slider as TS_SliderV1} from '../main/slider/v1/index.js';
import {TS_Slider as TS_SliderV3} from '../main/slider/v3/index.js';
import {TS_ReadMore as TS_ReadMoreV1} from '../main/read-more/v1/index.js';
import {TS_ReadMore as TS_ReadMoreV3} from '../main/read-more/v3/index.js';
import {TS_Radio as TS_RadioV1} from '../main/radio/v1/index.js';
import {TS_Radio as TS_RadioV3} from '../main/radio/v3/index.js';
import {TS_TextArea as TS_TextAreaV1} from '../main/textarea/v1/index.js';
import {TS_TextArea as TS_TextAreaFromV2} from '../main/textarea/v2/index.js';
import {TS_Tabs} from '../main/tabs/v1/index.js';
import {TS_Table} from '../main/table/v1/index.js';
import {TS_JSONViewer} from '../main/json-viewer/v1/index.js';
import {TS_CircularLoader, TS_ProgressBar, ThreeDotsLoader} from '../main/loaders/index.js';
import {TS_PropRenderer} from '../main/prop-renderer/v1/index.js';
import {Show} from '../main/components/Show.js';
import {TS_Overlay} from '../main/components/TS_Overlay/index.js';
import {TS_ButtonGroup} from '../main/button-group/index.js';
import {TS_Video} from '../main/video/index.js';
import {TS_ErrorBoundary} from '../main/error-boundary/index.js';
import {TS_DialogOverlay, ModuleFE_Dialog} from '../main/dialog/index.js';
import {TS_ToastOverlay, ModuleFE_Toaster} from '../main/toaster/index.js';
import {TS_DropDown} from '../main/adapter/dropdown/index.js';
import {SimpleListAdapter} from '../main/adapter/Adapter.js';
import {TS_Tree} from '../main/adapter/tree/index.js';
import {SimpleTreeAdapter} from '../main/adapter/Adapter.js';
import {TS_VirtualizedList} from '../main/virtualized-list/v1/index.js';
import {TS_ListOrganizer} from '../main/components/TS_ListOrganizer/index.js';
import {HeightBounder} from '../main/components/HeightBounder.js';
import {TS_MemoryMonitor} from '../main/_utils/TS_MemoryMonitor/index.js';

function CheckboxV1Demo() {
	const [checked, setChecked] = React.useState(false);
	return (
		<div data-testid="checkbox-v1-container">
			<TS_Checkbox id="checkbox-v1" checked={checked} onCheck={c => setChecked(c)}>Label v1</TS_Checkbox>
		</div>
	);
}
function CheckboxV2Demo() {
	const [checked, setChecked] = React.useState(false);
	return (
		<div data-testid="checkbox-v2-container">
			<TS_CheckboxFromV2 label="Label v2" checked={checked} onCheck={setChecked} id="checkbox-v2"/>
		</div>
	);
}
function CheckboxV3Demo() {
	const [checked, setChecked] = React.useState(false);
	return (
		<div data-testid="checkbox-v3-container">
			<TS_CheckboxFromV3 label="Label v3" checked={checked} onCheck={setChecked} id="checkbox-v3"/>
		</div>
	);
}

function TestApp() {
	return (
		<div id="widgets-test-app">
			<div data-testid="input-v1-container">
				<label htmlFor="input-v1">Input v1</label>
				<TS_InputV1 id="input-v1" type="text" placeholder="v1"/>
			</div>
			<div data-testid="input-v2-container">
				<label htmlFor="input-v2">Input v2</label>
				<TS_InputFromV2 id="input-v2" type="text" placeholder="v2"/>
			</div>
			<div data-testid="input-v3-container">
				<label htmlFor="input-v3">Input v3</label>
				<TS_InputFromV3 id="input-v3" type="text" placeholder="v3"/>
			</div>
			<CheckboxV1Demo/>
			<CheckboxV2Demo/>
			<CheckboxV3Demo/>
			<div data-testid="collapsable-v1-container">
				<TS_CollapsableContainer
					headerRenderer="Header v1"
					containerRenderer="Content v1"
					initialCollapsed={false}
				/>
			</div>
			<div data-testid="collapsable-v2-container">
				<TS_CollapsableContainerFromV2 headerRenderer="Header v2" containerRenderer="Content v2" initialCollapsed={false}/>
			</div>
			<div data-testid="collapsable-v3-container">
				<TS_CollapsableContainerFromV3 headerRenderer="Header v3" containerRenderer="Content v3" initialCollapsed={false}/>
			</div>
			<div data-testid="label-v1-container">
				<LabelV1>Label v1 text</LabelV1>
			</div>
			<div data-testid="label-v3-container">
				<LabelV3>Label v3 text</LabelV3>
			</div>
			<div data-testid="label-v1-custom-class-container">
				<LabelV1 className="label-custom-class">Label v1 text</LabelV1>
			</div>
			<div data-testid="label-v3-custom-class-container">
				<LabelV3 className="label-custom-class">Label v3 text</LabelV3>
			</div>
			<div data-testid="link-v1-container">
				<TS_LinkV1 url="/test">Link v1</TS_LinkV1>
			</div>
			<div data-testid="link-v3-container">
				<TS_LinkV3 url="/test">Link v3</TS_LinkV3>
			</div>
			<div data-testid="printable-v1-container">
				<TS_PrintableV1 printable={() => Promise.resolve()}>Printable v1</TS_PrintableV1>
			</div>
			<div data-testid="printable-v3-container">
				<TS_PrintableV3 printable={() => Promise.resolve()}>Printable v3</TS_PrintableV3>
			</div>
			<div data-testid="layouts-v1-container">
				<LL_V_L_V1 className="layouts-v1-demo"><span>A</span><span>B</span></LL_V_L_V1>
			</div>
			<div data-testid="layouts-v3-container">
				<LL_V_L_V3 className="layouts-v3-demo"><span>A</span><span>B</span></LL_V_L_V3>
			</div>
			<CheckboxGroupV1Demo/>
			<CheckboxGroupV3Demo/>
			<div data-testid="button-v1-container">
				<ButtonV1 onClick={() => {}}>Button v1</ButtonV1>
			</div>
			<div data-testid="button-v3-container">
				<ButtonV3 onClick={() => {}}>Button v3</ButtonV3>
			</div>
			<div data-testid="button-v1-disabled-container">
				<ButtonV1 disabled onClick={() => {}}>Button v1 disabled</ButtonV1>
			</div>
			<div data-testid="button-v3-disabled-container">
				<ButtonV3 disabled onClick={() => {}}>Button v3 disabled</ButtonV3>
			</div>
			<div data-testid="button-v1-loading-container">
				<ButtonV1 actionInProgress={true} onClick={() => {}}>Button v1 loading</ButtonV1>
			</div>
			<div data-testid="button-v3-loading-container">
				<ButtonV3 actionInProgress={true} onClick={() => {}}>Button v3 loading</ButtonV3>
			</div>
			<div data-testid="component-transition-v1-container">
				<TS_ComponentTransitionV1 trigger={true} transitionTimeout={0}><span>Transition v1</span></TS_ComponentTransitionV1>
			</div>
			<div data-testid="component-transition-v3-container">
				<TS_ComponentTransitionV3 trigger={true} transitionTimeout={0}><span>Transition v3</span></TS_ComponentTransitionV3>
			</div>
			<div data-testid="component-transition-v1-hidden-container">
				<TS_ComponentTransitionV1 trigger={false} transitionTimeout={0}><span>Transition v1 hidden</span></TS_ComponentTransitionV1>
			</div>
			<div data-testid="component-transition-v3-hidden-container">
				<TS_ComponentTransitionV3 trigger={false} transitionTimeout={0}><span>Transition v3 hidden</span></TS_ComponentTransitionV3>
			</div>
			<div data-testid="copy-to-clipboard-container">
				<TS_CopyToClipboard textToCopy="test">Copy</TS_CopyToClipboard>
			</div>
			<ToggleDemo/>
			<SliderDemo/>
			<ReadMoreDemo/>
			<RadioDemo/>
			<TextAreaDemo/>
			<TabsDemo/>
			<TableDemo/>
			<JsonViewerDemo/>
			<LoadersDemo/>
			<PropRendererDemo/>
			<ShowDemo/>
			<OverlayDemo/>
			<ButtonGroupDemo/>
			<VideoDemo/>
			<ErrorBoundaryDemo/>
			<DialogDemo/>
			<ToasterDemo/>
			<DropdownDemo/>
			<TreeDemo/>
			<VirtualizedListDemo/>
			<ListOrganizerDemo/>
			<HeightBounderDemo/>
			<MemoryMonitorDemo/>
		</div>
	);
}

const VIRTUAL_ITEMS = Array.from({length: 150}, (_, i) => <span key={i}>Item {i}</span>);

function VirtualizedListDemo() {
	return (
		<div data-testid="virtualized-list-container" style={{height: 200}}>
			<TS_VirtualizedList listToRender={VIRTUAL_ITEMS} itemHeight={24}/>
		</div>
	);
}

function ListOrganizerDemo() {
	const [items, setItems] = React.useState(['First', 'Second', 'Third']);
	return (
		<div data-testid="list-organizer-container">
			<TS_ListOrganizer
				items={items}
				onOrderChanged={setItems}
				renderer={({item, index, dragged}) => <div data-dragged={dragged}>{(item as string)}</div>}
			/>
		</div>
	);
}

function HeightBounderDemo() {
	return (
		<div data-testid="height-bounder-container">
			<HeightBounder><span>Height bounded content</span></HeightBounder>
		</div>
	);
}

function MemoryMonitorDemo() {
	return (
		<div data-testid="memory-monitor-container">
			<TS_MemoryMonitor labelResolver={() => 'test-env-1.0.0'}/>
		</div>
	);
}

function DialogDemo() {
	const openDialog = () => ModuleFE_Dialog.show({
		content: (onClose) => (
			<div data-testid="test-dialog-content" className="ts-dialog">
				<div>Test dialog body</div>
				<button type="button" onClick={() => ModuleFE_Dialog.close()}>Close</button>
			</div>
		),
	});
	return (
		<div data-testid="dialog-demo-container">
			<TS_DialogOverlay/>
			<button type="button" data-testid="dialog-open-trigger" onClick={openDialog}>Open dialog</button>
		</div>
	);
}

function ToasterDemo() {
	return (
		<div data-testid="toaster-demo-container">
			<TS_ToastOverlay/>
			<button type="button" data-testid="toast-info-trigger" onClick={() => ModuleFE_Toaster.toastInfo('Info message')}>Toast Info</button>
			<button type="button" data-testid="toast-success-trigger" onClick={() => ModuleFE_Toaster.toastSuccess('Success')}>Toast Success</button>
		</div>
	);
}

const DROPDOWN_ITEMS = ['Option A', 'Option B', 'Option C'];

function DropdownDemo() {
	const [selected, setSelected] = React.useState<string | undefined>(undefined);
	const adapter = React.useMemo(
		() => SimpleListAdapter(DROPDOWN_ITEMS, (node) => <span>{node.item}</span>),
		[],
	);
	return (
		<div data-testid="dropdown-container">
			<TS_DropDown
				adapter={adapter}
				selected={selected}
				onSelected={setSelected}
				placeholder="Select option"
			/>
		</div>
	);
}

const TREE_DATA = {root: {a: 'Node A', b: {c: 'Node C'}}};

function TreeDemo() {
	const adapter = React.useMemo(
		() => SimpleTreeAdapter(TREE_DATA, (node) => <span>{String(node.item)}</span>),
		[],
	);
	return (
		<div data-testid="tree-container">
			<TS_Tree
				id="test-tree"
				adapter={adapter}
				checkExpanded={(exp, path) => exp[path]}
			/>
		</div>
	);
}

function TextAreaDemo() {
	const [v2Value, setV2Value] = React.useState('');
	return (
		<>
			<div data-testid="textarea-v1-container">
				<label htmlFor="textarea-v1">TextArea v1</label>
				<TS_TextAreaV1 id="textarea-v1" type="text" placeholder="v1 placeholder"/>
			</div>
			<div data-testid="textarea-v2-container">
				<label htmlFor="textarea-v2">TextArea v2</label>
				<TS_TextAreaFromV2 id="textarea-v2" placeholder="v2 placeholder" value={v2Value} onChange={(v) => setV2Value(v)}/>
			</div>
		</>
	);
}

const TABS = [
	{uid: 'tab1', title: 'Tab 1', content: 'Content 1'},
	{uid: 'tab2', title: 'Tab 2', content: 'Content 2'},
	{uid: 'tab3', title: 'Tab 3', content: 'Content 3', disabled: true},
];

function TabsDemo() {
	return (
		<div data-testid="tabs-v1-container">
			<TS_Tabs tabs={TABS}/>
		</div>
	);
}

type TableRow = { name: string; value: number };
const TABLE_HEADERS: { header: keyof TableRow }[] = [{header: 'name'}, {header: 'value'}];
const TABLE_ROWS: TableRow[] = [{name: 'Row1', value: 1}, {name: 'Row2', value: 2}];

function TableDemo() {
	return (
		<div data-testid="table-v1-container">
			<TS_Table<TableRow>
				header={TABLE_HEADERS}
				rows={TABLE_ROWS}
				headerRenderer={(columnKey) => String(columnKey)}
				cellRenderer={(prop, item) => <span>{String(item[prop])}</span>}
			/>
		</div>
	);
}

const SAMPLE_JSON = {a: 1, b: {c: 2}, _private: 'hidden'};

function JsonViewerDemo() {
	return (
		<>
			<div data-testid="json-viewer-v1-container">
				<TS_JSONViewer item={SAMPLE_JSON}/>
			</div>
		</>
	);
}

function LoadersDemo() {
	return (
		<>
			<div data-testid="loader-circular-container">
				<TS_CircularLoader/>
			</div>
			<div data-testid="loader-progress-container">
				<TS_ProgressBar ratios={[0.3, 0.5]} type="linear-bar"/>
			</div>
			<div data-testid="loader-three-dots-container">
				<ThreeDotsLoader/>
			</div>
		</>
	);
}

function PropRendererDemo() {
	return (
		<>
			<div data-testid="prop-renderer-vertical-container">
				<TS_PropRenderer.Vertical label="Vertical label"><span>Child</span></TS_PropRenderer.Vertical>
			</div>
			<div data-testid="prop-renderer-horizontal-container">
				<TS_PropRenderer.Horizontal label="Horizontal label"><span>Child</span></TS_PropRenderer.Horizontal>
			</div>
			<div data-testid="prop-renderer-flat-container">
				<TS_PropRenderer.Flat label="Flat label"><span>Child</span></TS_PropRenderer.Flat>
			</div>
			<div data-testid="prop-renderer-error-container">
				<TS_PropRenderer.Vertical label="With error" error="Error message"><span>Child</span></TS_PropRenderer.Vertical>
			</div>
			<div data-testid="prop-renderer-disabled-container">
				<TS_PropRenderer.Vertical label="Disabled" disabled><span>Child</span></TS_PropRenderer.Vertical>
			</div>
		</>
	);
}

function ShowDemo() {
	return (
		<>
			<div data-testid="show-if-true-container">
				<Show>
					<Show.If condition={true}><span>Show when true</span></Show.If>
					<Show.Else><span>Else</span></Show.Else>
				</Show>
			</div>
			<div data-testid="show-if-false-container">
				<Show>
					<Show.If condition={false}><span>Show when false</span></Show.If>
					<Show.Else><span>Else content</span></Show.Else>
				</Show>
			</div>
		</>
	);
}

function OverlayDemo() {
	const [show, setShow] = React.useState(true);
	return (
		<div data-testid="overlay-container">
			<button type="button" onClick={() => setShow(!show)} data-testid="overlay-toggle">Toggle overlay</button>
			<TS_Overlay showOverlay={show} onClickOverlay={() => setShow(false)}>
				<div data-testid="overlay-child">Overlay child content</div>
			</TS_Overlay>
		</div>
	);
}

function ButtonGroupDemo() {
	const [selected, setSelected] = React.useState<string | undefined>('left');
	return (
		<>
			<div data-testid="button-group-horizontal-container">
				<TS_ButtonGroup
					direction="horizontal"
					buttons={{
						left: {key: 'left', label: 'Left', onClick: () => {}},
						right: {key: 'right', label: 'Right', onClick: () => {}},
					}}
					defaultButtonKey="left"
				/>
			</div>
			<div data-testid="button-group-vertical-container">
				<TS_ButtonGroup
					direction="vertical"
					controlled
					buttons={{
						up: {key: 'up', label: 'Up'},
						down: {key: 'down', label: 'Down'},
					}}
					selectedKey={selected}
					clickCallback={(k) => setSelected(k)}
				/>
			</div>
		</>
	);
}

function VideoDemo() {
	return (
		<div data-testid="video-container">
			<TS_Video
				source={{url: '/test-video.mp4', format: 'mp4'}}
				configuration={{controls: {}}}
				width={320}
				height={180}
				unsupportedVideoMessage="Video not supported"
			/>
		</div>
	);
}

function Thrower() {
	throw new Error('Test error');
}

function ErrorBoundaryDemo() {
	return (
		<>
			<div data-testid="error-boundary-ok-container">
				<TS_ErrorBoundary><span>No error</span></TS_ErrorBoundary>
			</div>
			<div data-testid="error-boundary-catch-container">
				<TS_ErrorBoundary><Thrower/></TS_ErrorBoundary>
			</div>
		</>
	);
}

function ToggleDemo() {
	const [checked, setChecked] = React.useState(false);
	return (
		<>
			<div data-testid="toggle-v1-container">
				<TS_ToggleV1 checked={checked} onCheck={setChecked}/>
			</div>
			<div data-testid="toggle-v3-container">
				<TS_ToggleV3 checked={checked} onCheck={setChecked}/>
			</div>
		</>
	);
}
function SliderDemo() {
	return (
		<>
			<div data-testid="slider-v1-container">
				<TS_SliderV1 min={0} max={100} startValue={50}/>
			</div>
			<div data-testid="slider-v3-container">
				<TS_SliderV3 min={0} max={100} startValue={50}/>
			</div>
		</>
	);
}
const LONG_TEXT = 'This is a long paragraph that should overflow the collapsed height so that the Read More and Read Less controls are visible. It contains multiple sentences to ensure the component has enough content to truncate. Keep adding more text until the read more link appears.';

function ReadMoreDemo() {
	return (
		<>
			<div data-testid="read-more-v1-container">
				<TS_ReadMoreV1 text={LONG_TEXT} collapsedHeight={40}/>
			</div>
			<div data-testid="read-more-v3-container">
				<TS_ReadMoreV3 text={LONG_TEXT} collapsedHeight={40}/>
			</div>
		</>
	);
}
function RadioDemo() {
	const [val, setVal] = React.useState<string | undefined>('a');
	return (
		<>
			<div data-testid="radio-v1-container">
				<TS_RadioV1 values={['a', 'b']} groupName="r1" checked={val} onCheck={v => setVal(v)}/>
			</div>
			<div data-testid="radio-v3-container">
				<TS_RadioV3 values={['a', 'b']} groupName="r2" checked={val} onCheck={v => setVal(v)}/>
			</div>
		</>
	);
}

function CheckboxGroupV1Demo() {
	const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
	return (
		<div data-testid="checkbox-group-v1-container">
			<TS_CheckboxGroupV1
				parent={{id: 'p', label: 'Parent v1'}}
				options={[{id: 'a', label: 'A'}, {id: 'b', label: 'B'}]}
				selectedIds={selectedIds}
				onChange={setSelectedIds}
			/>
		</div>
	);
}
function CheckboxGroupV3Demo() {
	const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
	return (
		<div data-testid="checkbox-group-v3-container">
			<TS_CheckboxGroupV3
				parent={{id: 'p', label: 'Parent v3'}}
				options={[{id: 'a', label: 'A'}, {id: 'b', label: 'B'}]}
				selectedIds={selectedIds}
				onChange={setSelectedIds}
			/>
		</div>
	);
}

const root = document.getElementById('root');
if (root) {
	createRoot(root).render(<TestApp/>);
}

declare global {
	interface Window {
		WidgetsTestReady?: boolean;
	}
}
window.WidgetsTestReady = true;

export {TS_InputV1, TS_InputFromV2, TS_InputFromV3};
export {TS_Checkbox};
