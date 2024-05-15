import {
  BlError,
  SerializedSignature,
  SignatureMetadata,
  UserDetail,
} from "@boklisten/bl-model";
import { Transformer } from "@napi-rs/image";

import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { Signature } from "../signature.schema";

const qualityFactor = 10;

export function serializeSignature(signature: Signature): SerializedSignature {
  const { image, ...rest } = signature;
  return {
    base64EncodedImage: image.toString("base64"),
    ...rest,
  };
}

export async function deserializeSignature(
  serializedSignature: SerializedSignature,
): Promise<Signature> {
  const { base64EncodedImage, ...rest } = serializedSignature;

  if (!isValidBase64(base64EncodedImage)) {
    throw new BlError("Invalid base64").code(701);
  }
  const image = await new Transformer(Buffer.from(base64EncodedImage, "base64"))
    .webp(qualityFactor)
    .catch((e) => {
      throw new BlError(`Unable to transform to WebP`).code(701).add(e);
    });

  return { image, ...rest };
}

export async function getValidUserSignature(
  userDetail: UserDetail,
  signatureStorage: BlDocumentStorage<Signature>,
): Promise<Signature | null> {
  const newestSignatureId = userDetail.signatures[0];
  if (newestSignatureId == undefined) return null;

  const signature = await signatureStorage.get(newestSignatureId);
  if (!signatureIsValidForUser(userDetail, signature)) {
    return null;
  }

  return signature;
}

export async function userHasValidSignature(
  userDetail: UserDetail,
  signatureStorage: BlDocumentStorage<Signature>,
): Promise<boolean> {
  return (await getValidUserSignature(userDetail, signatureStorage)) != null;
}

export function signatureIsValidForUser(
  userDetail: UserDetail,
  signature: SignatureMetadata,
): boolean {
  if (isSignatureExpired(signature)) {
    return false;
  }

  return isUnderage(userDetail) === signature.signedByGuardian;
}

export function isUnderage(userDetail: UserDetail): boolean {
  const now = new Date();
  const latestAdultBirthDate = new Date(
    now.getFullYear() - 18,
    now.getMonth(),
    now.getDate(),
  );
  return userDetail.dob > latestAdultBirthDate;
}

export function isSignatureExpired(signature: SignatureMetadata): boolean {
  const now = new Date();
  const oldestAllowedSignatureTime = new Date(
    now.getFullYear(),
    now.getMonth() - SignatureMetadata.NUM_MONTHS_VALID,
    now.getDate(),
  );

  return signature.creationTime < oldestAllowedSignatureTime;
}

// NodeJS will by default ignore non-base64 characters, which can lead to issues
function isValidBase64(input: string): boolean {
  return Buffer.from(input, "base64").toString("base64") === input;
}
