

export class BlError extends Error {
	private _code: number;
	private _className: string;
	private _methodName: string;
	private _errorStack: BlError[];
	private _data: any;
	
	constructor(msg: string, code?: number) {
		super(msg);
		this._errorStack = [];
		this.code(code);
	}
	
	add(blError: BlError) {
		this._errorStack.push(blError);
	}
	
	data(data: any): BlError {
		this.data = data;
		return this;
	}
	
	getData(): any {
		return this._data;
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
	
	msg(msg: string): BlError {
		this.message = msg;
		return this;
	}
	
	getMsg(): string {
		return this.message;
	}
	
	code(code: number) {
		this._code = code;
		return this;
	}
	
	getCode(): number {
		if (!this._code) return 0;
		return this._code;
	}
}