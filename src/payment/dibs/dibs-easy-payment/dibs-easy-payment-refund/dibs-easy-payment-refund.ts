import {JsonMember, JsonObject} from "typedjson-npm";
import {DibsEasyPaymentRefundOrderItem} from "./dibs-easy-payment-refund-order-item";

@JsonObject
export class DibsEasyPaymentRefund {
	@JsonMember({type: String})
	refundId: string;
	@JsonMember({type: String})
	amount: number;
	@JsonMember({type: String})
	state: string;
	@JsonMember({type: String})
	lastUpdated: string;
	@JsonMember({type: DibsEasyPaymentRefundOrderItem, elements: Array})
	orderItems: DibsEasyPaymentRefundOrderItem[]
}
