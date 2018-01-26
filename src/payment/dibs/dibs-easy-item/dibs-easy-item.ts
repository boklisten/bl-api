

export class DibsEasyItem {
	reference: string; //the reference of the orderItem
	name: string; //the title/name of the item
	quantity: number; //number of items
	unit: "kg" | "pcs" | "book";
	unitPrice: number; //price for a single item excluding VAT
	taxRate: number; //a number representing a percent: 2400 is equal to 24%
	taxAmount: number; // the total VAT amount of this order item
	grossTotalAmount: number; //the total amount including VAT
	netTotalAmount: number; //the total amount excluding VAT
}