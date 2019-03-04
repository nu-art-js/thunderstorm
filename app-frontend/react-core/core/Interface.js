/**
 * Created by tacb0ss on 02/08/2018.
 */
class Method {
	constructor(name, args = -1) {
		this.name = name;
		this.args = args;
	}
}

class Interface {
	constructor(name) {
		this.name = name;
		this.methods = [];
	}

	addMethod(name, args) {
		if (this[name])
			throw new Error(`Interface already has method: ${name}`);

		const method = new Method(name, args);
		this[name] = method;
		this.methods.push(method);

		return this;
	}

	validate(object) {
		this.methods.forEach((method) => {
			if (!object[method.name])
				throw new Error(`Object ${object.constructor}, does not implement interface: ${name}.${method.name}(.. ${method.args} ..)`);

			// if (method.args !== -1 && object[method.name].length !== method.args)
			//   throw new Error(`Object ${object.constructor}, implementation does not include ${method.args} arguments`);
		});
	}
}

export default (name) => {
	return new Interface(name);
};

