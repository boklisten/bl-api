import { BlError, EditableText } from "@boklisten/bl-model";

import { Hook } from "../../../hook/hook";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { editableTextSchema } from "../editable-text.schema";

export class EditableTextPutHook extends Hook {
  private readonly editableTextStorage: BlDocumentStorage<EditableText>;

  constructor(editableTextStorage?: BlDocumentStorage<EditableText>) {
    super();
    this.editableTextStorage = editableTextStorage
      ? editableTextStorage
      : new BlDocumentStorage(
          BlCollectionName.EditableTexts,
          editableTextSchema,
        );
  }

  // Our PUT implementation resets creationTime, but it shouldn't matter for this
  override async before(
    body: unknown,
    _accessToken: never,
    id: string,
  ): Promise<EditableText> {
    if (!validateEditableText(body)) {
      throw new BlError("Invalid EditableTextPatch request body").code(701);
    }
    return { id, text: body.text };
  }
}

export function validateEditableText(
  candidate: unknown,
): candidate is EditableText {
  return (
    candidate != null &&
    candidate["text"] != null &&
    typeof candidate["text"] === "string"
  );
}
