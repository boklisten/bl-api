import {JsonMember, JsonObject} from "typedjson-npm";
import {DibsEasyPaymentConsumerPhone} from "./dibs-easy-payment-consumer-phone";

@JsonObject
export class DibsEasyPaymentConsumerPrivatePerson {
	@JsonMember({type: Date})
	dateOfBirth: Date;
	@JsonMember({type: String})
	email: string;
	@JsonMember({type: String})
	firstName: string;
	@JsonMember({type: String})
	lastName: string;
	@JsonMember({type: String})
	merchantReference: string;
	@JsonMember({type: DibsEasyPaymentConsumerPhone})
	phoneNumber: DibsEasyPaymentConsumerPhone;
}