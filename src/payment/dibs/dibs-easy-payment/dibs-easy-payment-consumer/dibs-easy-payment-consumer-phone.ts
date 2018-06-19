import {JsonMember, JsonObject} from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentConsumerPhone {
	@JsonMember({type: String})
	prefix: string;
	@JsonMember({type: String})
	number: string;
}