import * as React from 'react';
import {TS_InputV2} from '@nu-art/thunderstorm/frontend/components/TS_V2_Input';
import {TS_Icons} from '@nu-art/ts-styles';

export const Input_Text_Blur = TS_InputV2.editable({saveEvent: ['blur'], type: 'text'});

export const Input_Number_Blur = TS_InputV2.editable({saveEvent: ['blur'], type: 'number'});

export const DropDownCaret = {
	open: <TS_Icons.treeCollapse.component/>,
	close: <TS_Icons.treeCollapse.component className={'flip'}/>
};