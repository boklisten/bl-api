import { BlapiResponse, Booking } from "@boklisten/bl-model";
import { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";

import { DateService } from "../../../blc/date.service";
import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { BlCollectionName } from "../../bl-collection";
import { bookingSchema } from "../../booking/booking.schema";

export class BranchBookingTimesOperation implements Operation {
  private dateService: DateService;
  constructor(
    private bookingStorage?: BlDocumentStorage<Booking>,
    private resHandler?: SEResponseHandler,
  ) {
    this.bookingStorage = this.bookingStorage
      ? this.bookingStorage
      : new BlDocumentStorage<Booking>(
          BlCollectionName.Bookings,
          bookingSchema,
        );
    this.resHandler = this.resHandler
      ? this.resHandler
      : new SEResponseHandler();

    this.dateService = new DateService();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    next?: NextFunction,
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let bookingTimes: any[];

    const aggregation = [
      {
        $match: {
          branch: new mongoose.Types.ObjectId(blApiRequest.documentId),
          from: { $gt: this.dateService.startOfDay(new Date()) },
          booked: false,
        },
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%d%m%Y",
              date: "$from",
            },
          },
        },
      },
      {
        $group: {
          _id: "$date",
        },
      },
    ];

    try {
      bookingTimes = await this.bookingStorage.aggregate(aggregation);
    } catch (e) {
      console.log("could not handle", e);
      return false;
    }

    if (bookingTimes) {
      const cleanedBookingTimes = bookingTimes.map((bookingTime) => {
        return {
          from: this.dateService.toDate(
            bookingTime["_id"],
            "DDMMYYYY",
            "Europe/Oslo",
          ),
        };
      });

      this.resHandler.sendResponse(
        res,
        new BlapiResponse([cleanedBookingTimes]),
      );
      return true;
    }
    return false;
  }
}
