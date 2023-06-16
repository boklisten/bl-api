import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { CustomerItemActiveBlid } from "../../customer-item/helpers/customer-item-active-blid";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { UniqueItem, BlapiResponse, BlError } from "@boklisten/bl-model";
import { uniqueItemSchema } from "../unique-item.schema";
import { BlCollectionName } from "../../bl-collection";

export class UniqueItemActiveOperation implements Operation {
  constructor(
    private customerItemActiveBlid?: CustomerItemActiveBlid,
    private uniqueItemStorage?: BlDocumentStorage<UniqueItem>,
    private resHandler?: SEResponseHandler
  ) {
    this.customerItemActiveBlid = customerItemActiveBlid
      ? customerItemActiveBlid
      : new CustomerItemActiveBlid();
    this.uniqueItemStorage = uniqueItemStorage
      ? uniqueItemStorage
      : new BlDocumentStorage(BlCollectionName.UniqueItems, uniqueItemSchema);
    this.resHandler = resHandler ? resHandler : new SEResponseHandler();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction
  ): Promise<boolean> {
    let uniqueItem: UniqueItem;
    try {
      uniqueItem = await this.uniqueItemStorage.get(blApiRequest.documentId);
    } catch (e) {
      throw new BlError("not found").code(702);
    }

    let activeCustomerItemIds;
    try {
      activeCustomerItemIds =
        await this.customerItemActiveBlid.getActiveCustomerItemIds(
          uniqueItem.blid
        );
    } catch (e) {
      this.sendResponse(res, []);
      return true;
    }

    this.sendResponse(res, activeCustomerItemIds);
    return true;
  }

  private sendResponse(res: Response, ids: string[]) {
    this.resHandler.sendResponse(res, new BlapiResponse(ids));
  }
}
