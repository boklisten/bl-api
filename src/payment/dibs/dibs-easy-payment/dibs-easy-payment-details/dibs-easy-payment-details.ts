import { DibsEasyPaymentDetailsCard } from "./dibs-easy-payment-details-card";
import { DibsEasyPaymentDetailsInvoiceDetail } from "./dibs-easy-payment-details-invoice-detail";

export interface DibsEasyPaymentDetails {
  paymentType: string;
  paymentMethod: string;
  invoiceDetails?: DibsEasyPaymentDetailsInvoiceDetail;
  cardDetails: DibsEasyPaymentDetailsCard;
}
