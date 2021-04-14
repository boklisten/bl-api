import { BlDocument } from "@boklisten/bl-model";

export class PasswordReset extends BlDocument {
  email: string;
  token?: string;
  userDetail?: string;
}
