import { JsonMember, JsonObject } from "typedjson-npm";
import { DibsEasyPaymentRefundOrderItem } from "./dibs-easy-payment-refund-order-item";

@JsonObject
export class DibsEasyPaymentRefund {
  @JsonMember()
  refundId: string;
  @JsonMember()
  amount: number;
  @JsonMember()
  state: string;
  @JsonMember()
  lastUpdated: string;
  @JsonMember({
    elements: DibsEasyPaymentRefundOrderItem
  })
  orderItems: DibsEasyPaymentRefundOrderItem[];
}
