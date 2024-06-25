import { BlapiResponse, BlError, CustomerItem } from "@boklisten/bl-model";
import { Request, Response } from "express";
import moment from "moment-timezone";
import { ObjectId } from "mongodb";
import { utils, write } from "xlsx";

import { customerItemSchema } from "./customer-item.schema";
import { isBoolean, isNullish } from "../../helper/typescript-helpers";
import { Operation } from "../../operation/operation";
import { BlApiRequest } from "../../request/bl-api-request";
import { BlDocumentStorage } from "../../storage/blDocumentStorage";
import { BlCollectionName } from "../bl-collection";

export interface CustomerItemGenerateReportSpec {
  branchFilter?: string[];
  createdAfter?: string;
  createdBefore?: string;
  returned: boolean;
  handout: boolean;
  buyout: boolean;
}

export function verifyCustomerItemGenerateReportSpec(
  customerItemGenerateReportSpec: unknown,
): customerItemGenerateReportSpec is CustomerItemGenerateReportSpec {
  const m = customerItemGenerateReportSpec as
    | Record<string, unknown>
    | null
    | undefined;
  return (
    !!m &&
    isBoolean(m["returned"]) &&
    isBoolean(m["handout"]) &&
    isBoolean(m["buyout"]) &&
    (isNullish(m["branchFilter"]) ||
      (Array.isArray(m["branchFilter"]) &&
        m["branchFilter"].every((branchId) => ObjectId.isValid(branchId)))) &&
    (isNullish(m["createdAfter"]) ||
      (typeof m["createdAfter"] === "string" &&
        !isNaN(new Date(m["createdAfter"]).getTime()))) &&
    (isNullish(m["createdBefore"]) ||
      (typeof m["createdBefore"] === "string" &&
        !isNaN(new Date(m["createdBefore"]).getTime())))
  );
}

export class CustomerItemGenerateReportOperation implements Operation {
  private readonly _customerItemStorage: BlDocumentStorage<CustomerItem>;

  constructor(customerItemStorage?: BlDocumentStorage<CustomerItem>) {
    this._customerItemStorage =
      customerItemStorage ??
      new BlDocumentStorage(BlCollectionName.CustomerItems, customerItemSchema);
  }

  async run(
    blApiRequest: BlApiRequest,
    _req: Request,
    res: Response,
  ): Promise<BlapiResponse> {
    const customerItemGenerateReportSpec = blApiRequest.data;
    if (!verifyCustomerItemGenerateReportSpec(customerItemGenerateReportSpec)) {
      throw new BlError(`Malformed CustomerItemGenerateReportSpec`).code(701);
    }
    const filterByHandoutBranchIfPresent =
      customerItemGenerateReportSpec.branchFilter
        ? {
            "handoutInfo.handoutById": {
              $in: customerItemGenerateReportSpec.branchFilter.map(
                (id) => new ObjectId(id),
              ),
            },
          }
        : {};

    const creationTimeLimiter: Record<string, Date> = {};
    if (customerItemGenerateReportSpec.createdAfter) {
      creationTimeLimiter["$gte"] = new Date(
        customerItemGenerateReportSpec.createdAfter,
      );
    }
    if (customerItemGenerateReportSpec.createdBefore) {
      creationTimeLimiter["$lte"] = new Date(
        customerItemGenerateReportSpec.createdBefore,
      );
    }
    const creationTimeFilter =
      Object.keys(creationTimeLimiter).length > 0
        ? { creationTime: creationTimeLimiter }
        : {};

    const reportData = await this._customerItemStorage.aggregate([
      {
        $match: {
          returned: customerItemGenerateReportSpec.returned,
          buyout: customerItemGenerateReportSpec.buyout,
          handout: customerItemGenerateReportSpec.handout,
          ...filterByHandoutBranchIfPresent,
          ...creationTimeFilter,
        },
      },
      {
        $lookup: {
          from: "branches",
          localField: "handoutInfo.handoutById",
          foreignField: "_id",
          as: "branchInfo",
        },
      },
      {
        $lookup: {
          from: "items",
          localField: "item",
          foreignField: "_id",
          as: "itemInfo",
        },
      },
      {
        $addFields: {
          customer: {
            $toObjectId: "$customer",
          },
        },
      },
      {
        $lookup: {
          from: "userdetails",
          localField: "customer",
          foreignField: "_id",
          as: "customerInfo",
        },
      },
      {
        $project: {
          handoutBranch: { $first: "$branchInfo.name" },
          handoutTime: "$handoutInfo.time",
          lastUpdated: 1,
          deadline: 1,
          blid: 1,
          title: { $first: "$itemInfo.title" },
          isbn: { $first: "$itemInfo.info.isbn" },
          name: { $first: "$customerInfo.name" },
          email: { $first: "$customerInfo.email" },
          phone: { $first: "$customerInfo.phone" },
          dob: { $first: "$customerInfo.dob" },
          pivot: "1",
        },
      },
    ]);
    const workbook = utils.book_new();
    const worksheet = utils.json_to_sheet(reportData);

    utils.book_append_sheet(workbook, worksheet, "Sheet1");

    const buffer = write(workbook, { bookType: "xlsx", type: "buffer" });

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="customer_item_report_${moment().format("YYYY-MM-DD_HH.mm")}.xlsx"`,
    );
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.send(buffer).end();

    return new BlapiResponse([]);
  }
}
