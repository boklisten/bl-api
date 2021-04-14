import { JsonMember, JsonObject } from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentDetailsCard {
  @JsonMember({ type: String })
  maskedPan: string;
  @JsonMember({ type: String })
  expiryDate: string;
}
