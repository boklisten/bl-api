import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentConsumer } from "./dibs-easy-payment-consumer/dibs-easy-payment-consumer";
import { DibsEasyPaymentDetails } from "./dibs-easy-payment-details/dibs-easy-payment-details";
import { DibsEasyPaymentOrderDetails } from "./dibs-easy-payment-order-details/dibs-easy-payment-order-details";
import { DibsEasyPaymentRefund } from "./dibs-easy-payment-refund/dibs-easy-payment-refund";
import { DibsEasyPaymentSummary } from "./dibs-easy-payment-summary/dibs-easy-payment-summary";

@JsonObject
export class DibsEasyPayment {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  paymentId: string;
  @JsonMember({ type: DibsEasyPaymentSummary })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  summary: DibsEasyPaymentSummary;
  @JsonMember({ type: DibsEasyPaymentConsumer })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  consumer: DibsEasyPaymentConsumer;
  @JsonMember({ type: DibsEasyPaymentDetails })
  paymentDetails?: DibsEasyPaymentDetails;
  @JsonMember({ type: DibsEasyPaymentOrderDetails })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  orderDetails: DibsEasyPaymentOrderDetails;
  checkout?: {
    url: string;
  };
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  created: string;
  @JsonMember({ elements: DibsEasyPaymentRefund })
  refunds?: DibsEasyPaymentRefund[];
}
