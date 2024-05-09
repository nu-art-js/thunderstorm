import * as React from 'react';
import {ComponentSync, ModuleFE_BaseApi} from '@nu-art/thunderstorm/frontend';
import {_keys, filterDuplicates, RuntimeModules, TypedMap} from '@nu-art/ts-common';
import {DBModuleType} from '@nu-art/thunderstorm';
import {graphviz} from 'd3-graphviz';
import {Digraph, Edge, Node, Subgraph, toDot} from 'ts-graphviz';


type State = {
	protoModules: ModuleFE_BaseApi<any>[]
};

export class Component_DependencyViewer
	extends ComponentSync<{}, State> {
	private readonly graphContainerRef = React.createRef<HTMLDivElement>();

	componentDidMount() {
		if (!this.graphContainerRef.current) {
			this.logWarning('Finished mounting but no ref to container');
			return;
		}
		this.renderGraph();
		this.forceUpdate();
	}

	protected deriveStateFromProps(nextProps: {}, state: State): State {
		state = super.deriveStateFromProps(nextProps, state);
		state.protoModules = RuntimeModules().filter<ModuleFE_BaseApi<any>>((module: DBModuleType) => !!module.dbDef?.dbKey);
		return state;
	}

	private getMidNode = (startNode: Node, endNode: Node, property: string) => {
		const id = `${startNode.id} => ${endNode.id} \n\nDependency property: ${property}`;
		return new Node(id, {
			id: id,
			shape: 'circle',
			width: 0.2,
			label: '',
			style: 'filled',
			fillcolor: '#ffffff',
			tooltip: id
		});
	};

	private getModuleNode = (module: DBModuleType) => {
		const id = module.dbDef!.dbKey;
		return new Node(id, {
			id: id,
			shape: 'rect',
			style: 'filled',
			label: module.dbDef!.entityName,
			fillcolor: '#ffffff',
			fontsize: 13,
			fontcolor: '#333333',
			width: 3
		});
	};

	private getDependencyNode = (startNode: Node, endNode: Node, midNode: Node) => {
		const id = `${startNode.id} => ${endNode.id}`;
		return [new Edge([startNode, midNode], {id: id, arrowhead: 'none'}), new Edge([midNode, endNode], {id: id})];
	};

	private getGraphString = (): string => {
		const graph = new Digraph('', {bgcolor: 'transparent'});
		const subgraph = new Subgraph('Container');
		graph.addSubgraph(subgraph);
		const moduleNodes: TypedMap<Node> = {};

		this.state.protoModules.forEach(module => {
			const moduleNode = this.getModuleNode(module);
			moduleNodes[module.dbDef.dbKey!] = moduleNode;
			subgraph.addNode(moduleNode);
		});

		this.state.protoModules.forEach(module => {
			const startNode = moduleNodes[module.dbDef.dbKey];
			if (module.dbDef.dependencies)
				filterDuplicates(_keys(module.dbDef.dependencies), item => module.dbDef.dependencies[item].dbKey).map(key => {
					const endNode = moduleNodes[module.dbDef.dependencies[key].dbKey];
					const midNode = this.getMidNode(startNode, endNode, key as string);
					const edge = this.getDependencyNode(startNode, endNode, midNode);
					subgraph.addNode(midNode);
					subgraph.addEdge(edge[0]);
					subgraph.addEdge(edge[1]);
				});
		});

		return toDot(graph);
	};

	private renderGraph = () => {
		const graphString = this.getGraphString();
		const rect = this.graphContainerRef.current!.getBoundingClientRect();

		graphviz(this.graphContainerRef.current, {
			useWorker: false,
			width: rect.width,
			height: rect.height
		}).renderDot(graphString);
	};

	render() {
		return <div className={'match_parent'} ref={this.graphContainerRef}/>;
	}
}