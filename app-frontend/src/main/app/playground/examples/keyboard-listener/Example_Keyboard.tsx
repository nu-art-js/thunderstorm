// /*
//  * A typescript & react boilerplate with api call example
//  *
//  * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
//  *
//  * Licensed under the Apache License, Version 2.0 (the "License");
//  * you may not use this file except in compliance with the License.
//  * You may obtain a copy of the License at
//  *
//  *     http://www.apache.org/licenses/LICENSE-2.0
//  *
//  * Unless required by applicable law or agreed to in writing, software
//  * distributed under the License is distributed on an "AS IS" BASIS,
//  * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
//  * See the License for the specific language governing permissions and
//  * limitations under the License.
//  */
//
// import * as React from "react";
// import {BaseComponent} from "@ir/thunderstorm/frontend";
// import {_keys} from "@ir/ts-common";
// import {
// 	KeyboardListener,
// 	KeyboardListenerComponentProps
// } from "../../../pages/keyboardListener_Temp/KeyboardListener";
// import {KeyboardListenerTreeExample} from "../../../pages/keyboardListener_Temp/KeyboardListenerTreeExample";
//
// type State = { focused?: string, actionMessage: string };
// export type Element = {label: string, action?: ()=>void}
//
// export class Example_KeyboardOnTree1
// 	extends BaseComponent<{}, State> {
//
// 	private myListenerKey = "myDiv";
// 	private node: any = null;
// 	private elements:{[key:string]: Element} = {
// 		First: {
// 			label: 'First element',
// 			action: () => {
// 				this.setState({focused: 'First', actionMessage: "You just performed the first element action!!"})
// 			}
// 		},
// 		Second: {
// 			label: 'Second element',
// 			action: () => {
// 				this.setState({focused: 'Second', actionMessage: "Yey! You executed 2nd element action!!"})
// 			}
// 		},
// 		Third: {
// 			label: 'Third element',
// 			action: () => {
// 				this.setState({focused: 'Third', actionMessage: "And now - number 3!!"})
// 			}
// 		},
// 	};
//
// 	state: State = {
// 		actionMessage: 'No action yet'
// 	};
//
// 	__onKeyEvent = (key: string, e: KeyboardEvent) => {
// 		if (key !== this.myListenerKey)
// 			return;
//
// 		if (e.code === "Escape")
// 			return this.node.blur();
//
// 		const elementsArr: string[] = _keys(this.elements);
// 		const idx = elementsArr.findIndex(el => el === this.state.focused);
// 		if (idx >= elementsArr.length)
// 			return;
//
// 		if (e.code === "ArrowDown" || e.code === "ArrowRight") {
// 			if (idx === -1 || idx + 1 === elementsArr.length)
// 				return this.setState({focused: "First"});
//
// 			return this.setState({focused: elementsArr[idx + 1]})
// 		}
//
// 		if (e.code === "ArrowUp" || e.code === "ArrowLeft") {
// 			if (idx === -1)
// 				return this.setState({focused: elementsArr[0]});
//
// 			if (idx === 0)
// 				return this.setState({focused: elementsArr[elementsArr.length-1]});
//
// 			return this.setState({focused: elementsArr[idx - 1]})
// 		}
//
// 		if (e.code === "Enter" && this.state.focused) {
// 			const action = this.elements[this.state.focused].action;
// 			return action? action() : null;
// 		}
//
// 	};
//
// 	blur = () => {
// 		this.myListener.removeKeyboardEventListener();
// 		this.setState({focused: '', actionMessage: 'No action yet'})
// 	};
//
// 	render() {
// 		return <>
// 			<h1>Click inside the frame</h1>
// 			<div>Use arrows to focus on elements and "Enter" to choose</div>
// 			<div>"Escape" to blur</div>
// 			<div>Or use the mouse as usual</div>
// 			<div
// 				ref={node => this.node = node}
// 				className={'ll_h_c'}
// 				tabIndex={1}
// 				onFocus={() => this.myListener.addKeyboardEventListener()}
// 				onBlur={this.blur}
// 				style={{border: "3px solid lime", width: "100%", justifyContent: "space-around", marginTop: 8}}>
// 				{_keys(this.elements).map(el => <h2 key={el}
// 				                                    id={(el as string)}
// 				                                    style={{backgroundColor: this.state.focused === el ? "lime" : "unset"}}
// 				                                    onClick={this.elements[el].action}>{this.elements[el].label}</h2>)}
// 			</div>
// 			<h4>{this.state.actionMessage}</h4>
// 			<div style={{width: "100%"}}><hr/><hr/></div>
// 			<InheritingElement enableKeyboardControl={true} myListenerKey={"key2"}/>
// 			<div style={{width: "100%"}}><hr/><hr/></div>
// 			<KeyboardListenerTreeExample/>
// 		</>
// 	}
// }
//
// class InheritingElement
// 	extends KeyboardListener<KeyboardListenerComponentProps, State> {
//
// 	state: State = {
// 		actionMessage: 'No action yet'
// 	};
//
// 	private elements:{[key:string]: Element} = {
// 		First: {
// 			label: 'First element',
// 			action: () => {
// 				this.setState({focused: 'First', actionMessage: "You just performed the first element action!!"})
// 			}
// 		},
// 		Second: {
// 			label: 'Second element',
// 			action: () => {
// 				this.setState({focused: 'Second', actionMessage: "Yey! You executed 2nd element action!!"})
// 			}
// 		},
// 		Third: {
// 			label: 'Third element',
// 			action: () => {
// 				this.setState({focused: 'Third', actionMessage: "And now - number 3!!"})
// 			}
// 		},
// 	};
//
// 	protected keyEventHandler(e: KeyboardEvent) {
// 		if (e.code === "Escape")
// 			return this.node.blur();
//
// 		const elementsArr: string[] = _keys(this.elements);
// 		const idx = elementsArr.findIndex(el => el === this.state.focused);
// 		if (idx >= elementsArr.length)
// 			return;
//
// 		if (e.code === "ArrowDown" || e.code === "ArrowRight") {
// 			if (idx === -1 || idx + 1 === elementsArr.length)
// 				return this.setState({focused: "First"});
//
// 			return this.setState({focused: elementsArr[idx + 1]})
// 		}
//
// 		if (e.code === "ArrowUp" || e.code === "ArrowLeft") {
// 			if (idx === -1)
// 				return this.setState({focused: elementsArr[0]});
//
// 			if (idx === 0)
// 				return this.setState({focused: elementsArr[elementsArr.length-1]});
//
// 			return this.setState({focused: elementsArr[idx - 1]})
// 		}
//
// 		if (e.code === "Enter" && this.state.focused) {
// 			const action = this.elements[this.state.focused].action;
// 			return action? action() : null;
// 		}
// 	}
//
// 	protected onBlurHandler(): void {
// 		this.setState({focused: '', actionMessage: 'No action yet'})
// 	}
//
// 	protected onFocusHandler(): void {
// 		this.setState({actionMessage:"You're focused on the component"})
// 	}
//
// 	protected renderContent = () => <div className={'ll_v_c'}>
// 		<div className={'ll_h_c'} style={{border: "3px solid lime", width: "100%", justifyContent: "space-around", marginTop: 8}}>
// 			{_keys(this.elements).map(el => <h2 key={el}
// 			                                    id={(el as string)}
// 			                                    style={{backgroundColor: this.state.focused === el ? "lime" : "unset"}}
// 			                                    onClick={this.elements[el].action}>{this.elements[el].label}</h2>)}
// 		</div>
// 		<h4>{this.state.actionMessage}</h4>
// 	</div>;
// }
//
//
