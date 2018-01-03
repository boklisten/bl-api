

export class TemplateInput {
	private _name: string;
	private _username: string;
	private _totalAmount: number;
	private _templateType: string;
	private _items: {
		id: string,
		name: string,
		price: number,
		discount: number,
		duedate: Date,
		newDuedate: Date
	}[];
	
	constructor() {
	
	}
	
	get name(): string {
		return this._name;
	}
	
	set name(value: string) {
		this._name = value;
	}
	
	get username(): string {
		return this._username;
	}
	
	set username(value: string) {
		this._username = value;
	}
	
	get totalAmount(): number {
		return this._totalAmount;
	}
	
	set totalAmount(value: number) {
		this._totalAmount = value;
	}
	
	get templateType(): string {
		return this._templateType;
	}
	
	set templateType(value: string) {
		this._templateType = value;
	}
	
	get items(): { id: string; name: string; price: number; discount: number; duedate: Date; newDuedate: Date }[] {
		return this._items;
	}
	set items(value: { id: string; name: string; price: number; discount: number; duedate: Date; newDuedate: Date }[]) {
		this._items = value;
	}
	
}