import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentRefundOrderItem } from "./dibs-easy-payment-refund-order-item";

@JsonObject
export class DibsEasyPaymentRefund {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  refundId: string;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  amount: number;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  state: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  lastUpdated: string;
  @JsonMember({
    elements: DibsEasyPaymentRefundOrderItem,
  })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  orderItems: DibsEasyPaymentRefundOrderItem[];
}
