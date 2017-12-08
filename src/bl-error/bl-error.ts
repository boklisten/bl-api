

export class BlError extends Error {
	private _code: number;
	
	constructor(msg?: string, code?: number) {
		super(msg);
		
		this.code = code;
	}
	
	get msg(): string {
		if (!this.message) return 'no message provided for BlError';
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