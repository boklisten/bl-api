import { JsonMember, JsonObject } from "typedjson-npm";

import { DibsEasyPaymentConsumerPhone } from "./dibs-easy-payment-consumer-phone";

@JsonObject
export class DibsEasyPaymentConsumerPrivatePerson {
  @JsonMember({ type: Date })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  dateOfBirth: Date;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  email: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  firstName: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  lastName: string;
  @JsonMember({ type: String })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  merchantReference: string;
  @JsonMember({ type: DibsEasyPaymentConsumerPhone })
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  phoneNumber: DibsEasyPaymentConsumerPhone;
}
