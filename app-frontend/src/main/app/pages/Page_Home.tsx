// import {css} from "emotion";
import * as React from "react";
import {Hello} from "../../example";

// const centredImage = css`
//   position: absolute;
//   left: 50%;
//   top: 50%;
//   -webkit-transform: translate(-50%, -50%);
//   transform: translate(-50%, -50%);
// `;


export class Page_Home
	extends React.Component {
	constructor(props: {}) {
		super(props);

		this.state = {
			formFields: {},
		};
	}

	render() {
		return 				<Hello/>;

		// return (
		// 	<div className="match_height match_width ll_v_c" style={{paddingTop: "82px"}}>
		// 		<div className="ll_h_c">
		// 			<img src="/images/icon__add.png" className={centredImage}/>
		// 		</div>
		// 	</div>
		// );
	}
}