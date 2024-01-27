import { JsonMember, JsonObject } from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentDetailsInvoiceDetail {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  invoiceNumber: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  ocr: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  pdfLink: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  dueDate: string;
}
