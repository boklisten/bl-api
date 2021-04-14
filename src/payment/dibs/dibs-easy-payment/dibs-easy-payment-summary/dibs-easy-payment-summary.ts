import { JsonMember, JsonObject } from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentSummary {
  @JsonMember({ type: Number })
  reservedAmount?: number;
  @JsonMember({ type: Number })
  chargedAmount?: number;
  @JsonMember({ type: Number })
  refundedAmount?: number;
  @JsonMember({ type: Number })
  cancelledAmount?: number;
}
