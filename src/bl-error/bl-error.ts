

export class BlError extends Error {
	private _code: number;
	private _className: string;
	private _methodName: string;
	private _errorStack: BlError[];
	
	constructor(msg: string, code?: number) {
		super(msg);
		this._errorStack = [];
		this.code = code;
	}
	
	add(blError: BlError) {
		this._errorStack.push(blError);
	}
	
	get errorStack(): BlError[] {
		return this._errorStack;
	}
	
	className(className: string): BlError {
		this._className = className;
		return this;
	}
	
	getClassName(): string {
		return this._className;
	}
	
	methodName(methodName: string): BlError {
		this._methodName = methodName;
		return this;
	}
	
	getMethodName(): string {
		return this._methodName;
	}
	
	get msg(): string {
		return this.message;
	}
	
	set code(code) {
		this._code = code;
	}
	
	get code(): number {
		if (!this._code) return 0;
		return this._code;
	}
}