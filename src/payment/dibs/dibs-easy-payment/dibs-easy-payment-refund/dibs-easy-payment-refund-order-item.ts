import { JsonMember, JsonObject } from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentRefundOrderItem {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  name: string;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  quantity: number;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  unit: string;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  unitPrice: number;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  taxRate: number;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  taxAmount: number;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  grossTotalAmount: number;
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  netTotalAmount: number;
}
