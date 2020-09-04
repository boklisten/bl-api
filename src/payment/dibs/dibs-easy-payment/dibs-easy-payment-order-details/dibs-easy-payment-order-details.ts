import {JsonMember, JsonObject} from 'typedjson-npm';

@JsonObject
export class DibsEasyPaymentOrderDetails {
  @JsonMember({type: Number})
  amount: number;
  @JsonMember({type: String})
  currency: string;
  @JsonMember({type: String})
  reference: string;
}
