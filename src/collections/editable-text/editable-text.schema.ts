import { EditableText } from "@boklisten/bl-model";
import { Schema } from "mongoose";

export const editableTextSchema = new Schema<EditableText>({
  text: {
    type: String,
    required: true,
  },
});
