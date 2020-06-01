import {
	Tab,
	Tabs
} from "@nu-art/thunderstorm/app-frontend/components/Tabs";
import * as React from "react";
import {CSSProperties} from "react";
import {COLORS} from "@res/colors";

const selectedStyle: CSSProperties = {
	color: COLORS.brightSkyBlue,
	borderBottomStyle: "solid",
	borderBottomColor: COLORS.brightSkyBlue,
	borderBottomWidth: 2,
	paddingBottom: 2,
	paddingLeft: 2,
	paddingRight: 2,
	fontSize: 18,
	fontWeight: 500
};

const nonSelectedStyle: CSSProperties = {
	color: COLORS.darkTwo,
	fontSize: 18,
	paddingBottom: 4,
	fontWeight: 200
};

export class Example_Tabs2 extends React.Component<{}> {

	render(){
		return <Tabs
			selectedStyle={selectedStyle}
			nonSelectedStyle={nonSelectedStyle}
			tabs={[
				new Tab("Button", <div style={{padding: 20}}><button>a button</button></div>),
				new Tab("Text", <div style={{padding: 20}}>Hi</div>)
			]}
		/>
	}
}