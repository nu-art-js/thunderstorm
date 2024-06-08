import {BaseCommando} from '../core/BaseCommando';
import {CliBlock} from '../types';


export class Commando_Programming
	extends BaseCommando {

	/**
	 * Constructs an if-else conditional command structure.
	 * @param {string} condition - The condition for the if statement.
	 * @param {CliBlock} ifBlock - Block of commands to execute if the condition is true.
	 * @param {CliBlock} [elseBlock] - Optional block of commands to execute if the condition is false.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public if(condition: string, ifBlock: CliBlock<this>, elseBlock?: CliBlock<this>): this {
		this.append(`if ${condition}; then`);
		this.indentIn();
		ifBlock(this);

		if (elseBlock) {
			this.indentOut();
			this.append('else');
			this.indentIn();
			elseBlock(this);
		}

		this.indentOut();
		this.append('fi');
		this.emptyLine();
		return this;
	}

	/**
	 * Constructs a for loop command structure.
	 * @param {string} varName - The variable name used in the loop.
	 * @param {string | string[]} arrayNameOrValues - The array name or array of values to iterate over.
	 * @param {CliBlock} loop - Block of commands to execute in each iteration of the loop.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	public for(varName: string, arrayNameOrValues: string | string[], loop: CliBlock<this>): this {
		if (typeof arrayNameOrValues === 'string') {
			this.append(`for ${varName} in "\${${arrayNameOrValues}[@]}"; do`);
		} else {
			const values = arrayNameOrValues.map(value => `"${value}"`).join(' ');
			this.append(`for ${varName} in ${values}; do`);
		}
		this.indentIn();
		loop(this);
		this.indentOut();
		this.append('done');
		this.emptyLine();
		return this;
	}

	/**
	 * Appends a 'continue' command for loop control.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	continue(): this {
		this.append('continue');
		return this;
	}

	/**
	 * Appends a 'break' command for loop control.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	break(): this {
		this.append('break');
		return this;
	}

	/**
	 * Appends a 'return' command for exiting a function or script.
	 * @returns {this} - The Cli instance for method chaining.
	 */
	return(): this {
		this.append('return');
		return this;
	}
}
