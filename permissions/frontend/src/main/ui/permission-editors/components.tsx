import {EDITABLE} from '@nu-art/editable-item';
import {TS_Icons} from '@nu-art/ts-styles';

export const Input_Text_Blur = EDITABLE.Input.editable({saveEvent: ['blur'], type: 'text'});

export const Input_Number_Blur = EDITABLE.Input.editableNumber({saveEvent: ['blur'], type: 'number'});

export const DropDownCaret = {
	open: <TS_Icons.treeCollapse.component/>,
	close: <TS_Icons.treeCollapse.component className={'flip'}/>
};