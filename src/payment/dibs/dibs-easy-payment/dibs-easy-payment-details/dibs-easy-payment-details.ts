import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentDetailsCard } from "./dibs-easy-payment-details-card";
import { DibsEasyPaymentDetailsInvoiceDetail } from "./dibs-easy-payment-details-invoice-detail";

@JsonObject
export class DibsEasyPaymentDetails {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  paymentType: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  paymentMethod: string;
  @JsonMember({ type: DibsEasyPaymentDetailsInvoiceDetail })
  invoiceDetails?: DibsEasyPaymentDetailsInvoiceDetail;
  @JsonMember({ type: DibsEasyPaymentDetailsCard })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  cardDetails: DibsEasyPaymentDetailsCard;
}
