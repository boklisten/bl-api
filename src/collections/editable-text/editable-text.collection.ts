import { editableTextSchema } from "./editable-text.schema";
import { EditableTextPutHook } from "./hooks/editable-text.put.hook";
import { BlCollection, BlCollectionName, BlEndpoint } from "../bl-collection";

export class EditableTextCollection implements BlCollection {
  public collectionName = BlCollectionName.EditableTexts;
  public mongooseSchema = editableTextSchema;
  public endpoints: BlEndpoint[] = [
    {
      method: "getId",
    },
    {
      method: "getAll",
    },
    {
      method: "put",
      hook: new EditableTextPutHook(),
      restriction: {
        permissions: ["admin", "super"],
      },
    },
    {
      method: "delete",
      restriction: {
        permissions: ["admin", "super"],
      },
    },
  ];
}
