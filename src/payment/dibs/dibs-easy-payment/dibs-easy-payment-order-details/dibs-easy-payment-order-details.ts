import { JsonMember, JsonObject } from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentOrderDetails {
  @JsonMember({ type: Number })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  amount: number;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  currency: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  reference: string;
}
