import {React, css, BaseComponent, Slider} from "nu-art--react-core";

const page = css({
	"height": "100%",
	"width": "100%",
	"background": "black"
});

class Page_Test
	extends BaseComponent {

	constructor(props) {
		super(props);
		this.state = {};
	}

	render() {
		return (
			<div className={page}>
				<div className={"ll_v_c match_height"} style={{height: "100%", background: "blue"}}>
					<div className={"ll_h_c match_height"} style={{height: "100%", width: "200px", background: "green"}}>
						<Slider ></Slider>
					</div>
				</div>
			</div>
		);
	}
}

export default Page_Test;


