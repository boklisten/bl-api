import { Message, BlError } from "@boklisten/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { SEDbQueryBuilder } from "../../../query/se.db-query-builder";
import { logger } from "../../../logger/logger";

export class MessageHelper {
  private queryBuilder: SEDbQueryBuilder;

  constructor(private messageStorage: BlDocumentStorage<Message>) {
    this.queryBuilder = new SEDbQueryBuilder();
  }

  public async isAdded(message: Message) {
    const dbQuery = this.queryBuilder.getDbQuery(
      {
        messageType: message.messageType,
        messageSubtype: message.messageSubtype,
        messageMethod: message.messageMethod,
        sequenceNumber: message.sequenceNumber.toString(),
        customerId: message.customerId,
      },
      [
        { fieldName: "messageType", type: "string" },
        { fieldName: "messageSubtype", type: "string" },
        { fieldName: "messageMethod", type: "string" },
        { fieldName: "customerId", type: "string" },
        { fieldName: "sequenceNumber", type: "number" },
      ]
    );

    try {
      const docs = await this.messageStorage.getByQuery(dbQuery);
      if (docs) {
        for (let doc of docs) {
          if (
            JSON.stringify(doc.htmlContent) ===
            JSON.stringify(message.htmlContent)
          ) {
            return true;
          }
        }
      }
      return false;
    } catch (e) {
      if (e instanceof BlError) {
        if (e.getCode() === 702) {
          // not found
          return false;
        }
      }
      throw e;
    }
  }
}
