import {JsonMember, JsonObject} from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentConsumerShippingAddress {
	@JsonMember({type: String})
	addressLine1: string;
	@JsonMember({type: String})
	addressLine2: string;
	@JsonMember({type: String})
	receiverLine: string;
	@JsonMember({type: String})
	postalCode: string;
	@JsonMember({type: String})
	city: string;
	@JsonMember({type: String})
	country: string;
}