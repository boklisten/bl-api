import {JsonMember, JsonObject} from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentRefundOrderItem {
	@JsonMember({type: String})
	name: string;
	@JsonMember({type: Number})
	quantity: number;
	@JsonMember({type: String})
	unit: string;
	@JsonMember({type: Number})
	unitPrice: number;
	@JsonMember({type: Number})
	taxRate: number;
	@JsonMember({type: Number})
	taxAmount: number;
	@JsonMember({type: Number})
	grossTotalAmount: number;
	@JsonMember({type: Number})
	netTotalAmount: number
}