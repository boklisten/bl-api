import { JsonMember, JsonObject } from "typedjson-npm";

@JsonObject
export class DibsEasyPaymentConsumerPhone {
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  prefix: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  number: string;
}
