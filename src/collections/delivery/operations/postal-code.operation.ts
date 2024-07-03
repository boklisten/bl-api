import { BlapiResponse, BlError } from "@boklisten/bl-model";

import { isNullish } from "../../../helper/typescript-helpers";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";

type SimplifiedBringPostalCodeResponse = {
  postal_codes?:
    | [
        {
          city: string;
        },
      ]
    | [];
  validation_errors?: [
    {
      code: string;
      description: string;
    },
  ];
};

export interface PostalCodeSpec {
  postalCode: string;
}

export function verifyPostalCodeSpec(
  postalCodeSpec: unknown,
): postalCodeSpec is PostalCodeSpec {
  const m = postalCodeSpec as Record<string, unknown> | null | undefined;
  return !!m && typeof m["postalCode"] === "string";
}

export class PostalCodeOperation implements Operation {
  async run(blApiRequest: BlApiRequest): Promise<BlapiResponse> {
    const postalCodeSpec = blApiRequest.data;
    if (!verifyPostalCodeSpec(postalCodeSpec)) {
      throw new BlError(`Malformed PostalCodeSpec`).code(701);
    }
    const bringHeaders = new Headers({
      "X-MyBring-API-Uid": process.env["BRING_API_ID"]!,
      "X-MyBring-API-Key": process.env["BRING_API_KEY"]!,
    });
    try {
      const postalLookupResult = await fetch(
        `https://api.bring.com/address/api/NO/postal-codes/${postalCodeSpec.postalCode}`,
        { method: "GET", headers: bringHeaders },
      );
      const response =
        (await postalLookupResult.json()) as SimplifiedBringPostalCodeResponse;

      if (response.validation_errors)
        return new BlapiResponse([
          { error: response.validation_errors[0].code },
        ]);
      if (
        isNullish(response.postal_codes) ||
        response.postal_codes.length === 0
      )
        return new BlapiResponse([{ error: "INVALID_POSTAL_CODE" }]);

      return new BlapiResponse([{ postalCity: response.postal_codes[0].city }]);
    } catch (error) {
      throw new BlError("failed to lookup postal code").data(error).code(500);
    }
  }
}
