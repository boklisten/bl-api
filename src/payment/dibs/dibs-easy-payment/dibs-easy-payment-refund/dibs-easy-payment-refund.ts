import { DibsEasyPaymentRefundOrderItem } from "./dibs-easy-payment-refund-order-item";

export interface DibsEasyPaymentRefund {
  refundId: string;
  amount: number;
  state: string;
  lastUpdated: string;
  orderItems: DibsEasyPaymentRefundOrderItem[];
}
