import { DibsEasyPaymentConsumer } from "./dibs-easy-payment-consumer/dibs-easy-payment-consumer";
import { DibsEasyPaymentDetails } from "./dibs-easy-payment-details/dibs-easy-payment-details";
import { DibsEasyPaymentOrderDetails } from "./dibs-easy-payment-order-details/dibs-easy-payment-order-details";
import { DibsEasyPaymentRefund } from "./dibs-easy-payment-refund/dibs-easy-payment-refund";
import { DibsEasyPaymentSummary } from "./dibs-easy-payment-summary/dibs-easy-payment-summary";

export interface DibsEasyPayment {
  paymentId: string;
  summary: DibsEasyPaymentSummary;
  consumer: DibsEasyPaymentConsumer;
  paymentDetails?: DibsEasyPaymentDetails;
  orderDetails: DibsEasyPaymentOrderDetails;
  checkout?: {
    url: string;
  };
  created: string;
  refunds?: DibsEasyPaymentRefund[];
}
