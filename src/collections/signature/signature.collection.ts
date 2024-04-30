import { SignatureGetIdHook } from "./hooks/signature.get-id.hook";
import { SignaturePostHook } from "./hooks/signature.post.hook";
import { signatureSchema } from "./signature.schema";
import {
  BlCollection,
  BlCollectionName,
  BlDocumentPermission,
  BlEndpoint,
} from "../bl-collection";

export class SignatureCollection implements BlCollection {
  public collectionName = BlCollectionName.Signatures;
  public mongooseSchema = signatureSchema;
  documentPermission: BlDocumentPermission = {
    viewableForPermission: "employee",
  };

  public endpoints: BlEndpoint[] = [
    {
      method: "post",
      restriction: {
        permissions: ["customer", "employee", "manager", "admin", "super"],
        restricted: false,
      },
      hook: new SignaturePostHook(),
    },
    {
      method: "getId",
      restriction: {
        permissions: ["customer", "employee", "manager", "admin", "super"],
        restricted: true,
      },
      hook: new SignatureGetIdHook(),
    },
  ];
}
