import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentRefundOrderItem } from "./dibs-easy-payment-refund-order-item";

@JsonObject
export class DibsEasyPaymentRefund {
  @JsonMember({ type: String })
  refundId: string;
  @JsonMember({ type: Number })
  amount: number;
  @JsonMember({ type: String })
  state: string;
  @JsonMember({ type: String })
  lastUpdated: string;
  @JsonMember({
    elements: DibsEasyPaymentRefundOrderItem,
  })
  orderItems: DibsEasyPaymentRefundOrderItem[];
}
