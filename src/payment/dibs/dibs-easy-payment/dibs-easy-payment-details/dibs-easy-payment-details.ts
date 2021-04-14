import { JsonMember, JsonObject } from "typedjson-npm";
import { DibsEasyPaymentDetailsInvoiceDetail } from "./dibs-easy-payment-details-invoice-detail";
import { DibsEasyPaymentDetailsCard } from "./dibs-easy-payment-details-card";

@JsonObject
export class DibsEasyPaymentDetails {
  @JsonMember({ type: String })
  paymentType: string;
  @JsonMember({ type: String })
  paymentMethod: string;
  @JsonMember({ type: DibsEasyPaymentDetailsInvoiceDetail })
  invoiceDetails?: DibsEasyPaymentDetailsInvoiceDetail;
  @JsonMember({ type: DibsEasyPaymentDetailsCard })
  cardDetails: DibsEasyPaymentDetailsCard;
}
