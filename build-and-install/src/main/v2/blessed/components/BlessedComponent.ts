import {BadImplementationException, cloneObj, compare, debounce, deepClone, Logger, mergeObject} from '@nu-art/ts-common';
import {BlessedWidget, BlessedWidgetOptions, BlessedWidgetsType, createBlessedWidget} from '../core';
import {dispatcher_PhaseChange, dispatcher_UnitChange, dispatcher_UnitStatusChange} from '../../phase-runner/PhaseRunnerDispatcher';

type InferChildProps<Child extends BlessedComponent<BlessedWidgetsType, any, any>> = Child extends BlessedComponent<BlessedWidgetsType, infer Props, any> ? Props : never;

/**
 * BlessedComponent
 * this class expands on the neo-blessed library to provide a React-like lifecycle
 * to the creation and rendering using neo-blessed classes.
 *
 * Like in react, the setProps function allows the component to receive props from the outside.<br>
 * then, if the new props are different in content to the current props the component knows,
 * the component will re-calculate its state.<br>
 *
 * If the newly calculated state in turn is also different to the one the component knows,
 * a re-render will commence, and the updateProps will drill down to each of the components
 * children.
 *
 * Unlike react, we are not collecting HTML structure into a virtual DOM and any changes are
 * happening on screen in realtime, therefore "rendering" is divided into 3 steps:
 *
 * 1. class creation - this step is happening when called from outside the class.
 * 		this step is implemented with the create() function. <br>
 *
 * 2. render - this step is happening everytime the calculated state is different from the one
 * 		currently held in the component. the point of this stage is to update the content of this
 * 		widget and call updateProps for its children with the new props. the actual call to render
 * 		is called internally. <br>
 *
 * 3. class destruction - this step is happening when called from outside the class.
 * 		this step is handled internally with the destroy() function. <br>
 */
export abstract class BlessedComponent<T extends BlessedWidgetsType, P extends {} = {}, S extends {} = {}>
	extends Logger {

	protected state: S;
	protected props: P;

	private readonly widgetType: T;
	private readonly widgetProps: BlessedWidgetOptions[T];
	public widget?: BlessedWidget[T];
	private children: { component: BlessedComponent<BlessedWidgetsType>, renderCB?: (state: S) => BlessedComponent<BlessedWidgetsType> }[];
	private parentWidget?: BlessedComponent<BlessedWidgetsType, any, any>;
	//Keeps track of if the component is alive
	protected alive: boolean;
	private renderDebounce = debounce(() => this.renderImpl(), 20, 100);

	protected constructor(type: T, widgetProps: BlessedWidgetOptions[T]) {
		super(BlessedComponent.name);
		this.widgetType = type;
		this.widgetProps = widgetProps;
		this.children = [];
		this.props = {} as P;
		this.state = this.getInitialState();
		this.alive = false;
	}

	public setParent = (parent: BlessedComponent<BlessedWidgetsType, any, any>) => {
		this.parentWidget = parent;
	};

	public setProps = (p: P) => {
		if (!this.alive)
			return;

		//Clone prevProps and nextProps to prevent referencing issues
		const prevProps = deepClone(this.props);
		const nextProps = deepClone(p);

		//If there is no difference in the content of the props,
		//no need to continue to calculate state.
		const diff = !compare(prevProps, nextProps);
		if (!diff)
			return;

		//spread prevState to prevent referencing issues
		const nextState = this.deriveStateFromProps(nextProps, cloneObj(this.state));

		//Cement next props as de-facto props from this point forwards
		this.props = nextProps;
		this.setState(nextState);
	};

	protected deriveStateFromProps(nextProps: P, state: S): S {
		return state;
	}

	protected getInitialState(): S {
		return {} as S;
	}

	protected setState(state: Partial<S>) {
		if (!this.alive)
			return;

		//Clone prevState to avoid referencing issues.
		const prevState = cloneObj(this.state);
		//nextState is a merge of the previous state and the new state data.
		const nextState = mergeObject(this.state, state);

		//Cement next state as de-facto state from this point forwards
		this.state = nextState;

		//If there is no difference between the content of the states,
		//no need to continue to render
		if (compare(prevState, nextState))
			return;

		//Render this component and update all of its children
		this.renderDebounce();
		// this.renderImpl();
	}

	//######################### Stage - Creation #########################

	public create(setAlive: boolean = true) {
		if (this.alive)
			return;

		this.createWidget();
		this.createChildren();
		this.children.forEach(child => child.component.create());
		//Start listening on dispatchers
		dispatcher_UnitStatusChange.addListener(this);
		dispatcher_PhaseChange.addListener(this);
		dispatcher_UnitChange.addListener(this);
		if (setAlive)
			this.alive = true;
		this.renderDebounce();
	}

	protected createWidget() {
		this.widget = createBlessedWidget(this.widgetType, this.widgetProps, this.parentWidget?.widget);
	}

	protected abstract createChildren(): void;

	public registerChild<Child extends BlessedComponent<BlessedWidgetsType, any, any>>(child: Child, onRenderPassChildProps?: (state: S) => InferChildProps<Child>) {
		child.setParent(this);
		this.children.push({component: child, renderCB: onRenderPassChildProps});
	}

	//######################### Stage - Render #########################

	private renderImpl() {
		if (!this.widget)
			throw new BadImplementationException('Calling renderImpl with no widget!');

		const currentState = this.state;
		//Update props for all children that have a props resolving callback
		this.children.forEach(child => {
			if (child.renderCB)
				child.component.setProps(child.renderCB(currentState));
		});
		//Render Self
		this.renderSelf();
		//Update the screen
		this.widget.render();
		this.widget.screen.render();
	}

	protected renderSelf() {
	}

	//######################### Stage - Destruction #########################

	public destroy() {
		if (!this.alive)
			return;

		//Stop listening on dispatchers
		dispatcher_UnitStatusChange.removeListener(this);
		dispatcher_PhaseChange.removeListener(this);
		dispatcher_UnitChange.removeListener(this);

		this.destroyChildren();
		this.widget?.destroy();
		delete this.widget;
		this.alive = false;
	}

	protected destroyChildren() {
		this.children.forEach(child => child.component.destroy());
		this.children = [];
	}
}