import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentConsumer } from "./dibs-easy-payment-consumer/dibs-easy-payment-consumer";
import { DibsEasyPaymentDetails } from "./dibs-easy-payment-details/dibs-easy-payment-details";
import { DibsEasyPaymentOrderDetails } from "./dibs-easy-payment-order-details/dibs-easy-payment-order-details";
import { DibsEasyPaymentRefund } from "./dibs-easy-payment-refund/dibs-easy-payment-refund";
import { DibsEasyPaymentSummary } from "./dibs-easy-payment-summary/dibs-easy-payment-summary";

@JsonObject
export class DibsEasyPayment {
  @JsonMember({ type: String })
  paymentId: string;
  @JsonMember({ type: DibsEasyPaymentSummary })
  summary: DibsEasyPaymentSummary;
  @JsonMember({ type: DibsEasyPaymentConsumer })
  consumer: DibsEasyPaymentConsumer;
  @JsonMember({ type: DibsEasyPaymentDetails })
  paymentDetails?: DibsEasyPaymentDetails;
  @JsonMember({ type: DibsEasyPaymentOrderDetails })
  orderDetails: DibsEasyPaymentOrderDetails;
  checkout?: {
    url: string;
  };
  @JsonMember({ type: String })
  created: string;
  @JsonMember({ elements: DibsEasyPaymentRefund })
  refunds?: DibsEasyPaymentRefund[];
}
