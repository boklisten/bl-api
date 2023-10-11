import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentDetailsCard } from "./dibs-easy-payment-details-card";
import { DibsEasyPaymentDetailsInvoiceDetail } from "./dibs-easy-payment-details-invoice-detail";

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
