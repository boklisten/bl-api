import { SerializedSignature } from "@boklisten/bl-model";

import { Hook } from "../../../hook/hook";
import { serializeSignature } from "../helpers/signature.helper";
import { Signature } from "../signature.schema";

export class SignatureGetIdHook extends Hook {
  public override async after(
    docs: Signature[],
  ): Promise<SerializedSignature[]> {
    return docs.map((signature) => serializeSignature(signature));
  }
}
