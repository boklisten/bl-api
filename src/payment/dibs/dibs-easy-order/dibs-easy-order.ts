
import {DibsEasyItem} from "../dibs-easy-item/dibs-easy-item";

export class DibsEasyOrder {
	reference: string; //the order-id of the order
	items: DibsEasyItem[]; //the items of the order
	amount: number; //the total grossAmount of all items
	currency: "NOK" | "SEK";
	checkout: {
		"url": string, //where the checkout is located, and where to redirect after 3-D secure are done
		"ShippingCountries": {
			countryCode: "NOR" | "SWE" //the country in which to ship the order
		}[]
	}
}