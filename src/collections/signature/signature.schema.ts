import { SignatureMetadata } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export class Signature extends SignatureMetadata {
  image!: Buffer;
}

export const signatureSchema = new Schema<Signature>({
  image: {
    type: Buffer,
    required: true,
  },
  signingName: {
    type: String,
    required: true,
  },
  signedByGuardian: {
    type: Boolean,
    required: true,
  },
});
