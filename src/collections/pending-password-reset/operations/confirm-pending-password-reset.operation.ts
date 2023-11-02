import {
  BlapiResponse,
  BlError,
  PasswordResetConfirmationRequest,
  PendingPasswordReset,
} from "@boklisten/bl-model";

import { LocalLoginHandler } from "../../../auth/local/local-login.handler";
import { SystemUser } from "../../../auth/permission/permission.service";
import { SeCrypto } from "../../../crypto/se.crypto";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { pendingPasswordResetSchema } from "../pending-password-reset.schema";

export class ConfirmPendingPasswordResetOperation implements Operation {
  constructor(
    private readonly pendingPasswordResetStorage?: BlDocumentStorage<PendingPasswordReset>,
    private readonly localLoginHandler?: LocalLoginHandler,
    private readonly responseHandler?: SEResponseHandler,
    private readonly seCrypto?: SeCrypto,
  ) {
    this.pendingPasswordResetStorage ??= new BlDocumentStorage(
      BlCollectionName.PendingPasswordResets,
      pendingPasswordResetSchema,
    );
    this.localLoginHandler ??= new LocalLoginHandler();
    this.responseHandler ??= new SEResponseHandler();
    this.seCrypto ??= new SeCrypto();
  }

  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const [pendingPasswordResetId, candidateToken] =
      parsePendingPasswordResetDocumentId(blApiRequest.documentId);
    const passwordResetConfirmationRequest: unknown = blApiRequest.data;
    validatePasswordResetConfirmationRequest(passwordResetConfirmationRequest);

    const pendingPasswordReset = await this.pendingPasswordResetStorage
      .get(pendingPasswordResetId)
      .catch((getPasswordResetError) => {
        throw new BlError(
          `PendingPasswordReset "${pendingPasswordResetId}" not found or expired`,
        )
          .code(702)
          .add(getPasswordResetError);
      });

    validatePendingPasswordResetNotExpired(pendingPasswordReset);
    validatePendingPasswordResetUnused(pendingPasswordReset);
    await verifyToken(candidateToken, pendingPasswordReset, this.seCrypto);

    await updatePassword(
      pendingPasswordReset,
      passwordResetConfirmationRequest.newPassword,
      this.localLoginHandler,
    );

    await deactivatePendingPasswordReset(
      pendingPasswordReset,
      this.pendingPasswordResetStorage,
    );

    return new BlapiResponse([]);
  }
}

function validatePasswordResetConfirmationRequest(
  candidate: unknown,
): asserts candidate is PasswordResetConfirmationRequest {
  if (!candidate || !candidate["newPassword"]) {
    throw new BlError(
      "blApiRequest.data.newPassword is null, empty or undefined",
    ).code(701);
  }

  if (typeof candidate["newPassword"] !== "string") {
    throw new BlError("blApiRequest.data.newPassword is not a string").code(
      701,
    );
  }

  const newPassword: string = candidate["newPassword"];

  if (newPassword.length < 6) {
    throw new BlError(
      "blApiRequest.data.newPassword is under length of 6",
    ).code(701);
  }
}

function parsePendingPasswordResetDocumentId(
  documentId?: string,
): [string, string] {
  if (!documentId) {
    throw new BlError("documentId is empty, null or undefined").code(701);
  }
  const parts = documentId.split(":");
  if (parts.length !== 2) {
    throw new BlError('documentId should be formatted as "ID:TOKEN"').code(701);
  }
  return parts as [string, string];
}

async function verifyToken(
  candidateToken: string,
  pendingPasswordReset: PendingPasswordReset,
  seCrypto: SeCrypto,
): Promise<void> {
  const candiateTokenHash = await seCrypto.hash(
    candidateToken,
    pendingPasswordReset.salt,
  );
  if (
    !seCrypto.timingSafeEqual(candiateTokenHash, pendingPasswordReset.tokenHash)
  ) {
    throw new BlError(
      "Invalid password reset attempt: candidate token hash does not match stored hash",
    ).code(702);
  }
}

function validatePendingPasswordResetNotExpired(
  pendingPasswordReset: PendingPasswordReset,
): void {
  const ms_in_week = 1000 * 60 * 60 * 24 * 7;
  if (
    new Date().getTime() - pendingPasswordReset.creationTime.getTime() >
    ms_in_week
  ) {
    throw new BlError(
      `PendingPasswordReset "${pendingPasswordReset.id}" expired`,
    )
      .code(702)
      .store("expiredAt", pendingPasswordReset.creationTime);
  }
}

function validatePendingPasswordResetUnused(
  pendingPasswordReset: PendingPasswordReset,
): void {
  if (!pendingPasswordReset.active) {
    throw new BlError(
      `PendingPasswordReset "${pendingPasswordReset.id}" already used`,
    ).code(702);
  }
}

async function updatePassword(
  pendingPasswordReset: PendingPasswordReset,
  newPassword: string,
  localLoginHandler: LocalLoginHandler,
): Promise<void> {
  await localLoginHandler
    .setPassword(pendingPasswordReset.email, newPassword)
    .catch((setPasswordError: BlError) => {
      throw new BlError("Could not update localLogin with password").add(
        setPasswordError,
      );
    });
}

async function deactivatePendingPasswordReset(
  pendingPasswordReset: PendingPasswordReset,
  pendingPasswordResetStorage: BlDocumentStorage<PendingPasswordReset>,
): Promise<void> {
  await pendingPasswordResetStorage
    .update(pendingPasswordReset.id, { active: false }, new SystemUser())
    .catch((updateActiveError) => {
      throw new BlError(
        `Unable to set PendingPasswordReset ${pendingPasswordReset.id} to not active`,
      ).add(updateActiveError);
    });
}
