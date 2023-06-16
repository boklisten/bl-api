import { BlError, Match } from "@boklisten/bl-model";
import { SEDbQuery } from "../../../query/se.db-query";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { matchSchema } from "../match.schema";

export async function getAllMatchesForUser(
  userDetailId: string
): Promise<Match[]> {
  const query = new SEDbQuery();
  query.objectIdFilters = [
    // By putting each value in an array, the filters are OR'd instead of AND'd
    { fieldName: "customer", value: [userDetailId] },
    { fieldName: "sender", value: [userDetailId] },
    { fieldName: "receiver", value: [userDetailId] },
  ];

  const matchStorage = new BlDocumentStorage(
    BlCollectionName.Matches,
    matchSchema
  );
  try {
    return (await matchStorage.getByQuery(query)) as Match[];
  } catch (e) {
    if (e instanceof BlError && e.getCode() === 702) {
      return [];
    }
    throw e;
  }
}
