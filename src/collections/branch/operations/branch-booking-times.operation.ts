import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { NextFunction, Request, Response } from "express";
import { bookingSchema } from "../../booking/booking.schema";
import { BlapiResponse, Booking } from "@wizardcoder/bl-model";
import { BlDocumentStorage } from "../../../storage/blDocumentStorage";
import { SEResponseHandler } from "../../../response/se.response.handler";
import { DateService } from "../../../blc/date.service";
import * as mongoose from "mongoose";

export class BranchBookingTimesOperation implements Operation {
  private dateService: DateService;
  constructor(
    private bookingStorage?: BlDocumentStorage<Booking>,
    private resHandler?: SEResponseHandler
  ) {
    this.bookingStorage = this.bookingStorage
      ? this.bookingStorage
      : new BlDocumentStorage<Booking>("bookings", bookingSchema);
    this.resHandler = this.resHandler
      ? this.resHandler
      : new SEResponseHandler();

    this.dateService = new DateService();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
    next?: NextFunction
  ): Promise<boolean> {
    let bookingTimes: any[];

    let aggregation = [
      {
        $match: {
          branch: mongoose.Types.ObjectId(blApiRequest.documentId),
          from: { $gt: this.dateService.startOfDay(new Date()) },
          booked: false
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: {
              format: "%d%m%Y",
              date: "$from"
            }
          }
        }
      },
      {
        $group: {
          _id: "$date"
        }
      }
    ];

    try {
      bookingTimes = await this.bookingStorage.aggregate(aggregation);
    } catch (e) {
      console.log("could not handle", e);
      return false;
    }

    if (bookingTimes) {
      let cleanedBookingTimes = bookingTimes.map(bookingTime => {
        return {
          from: this.dateService.toDate(
            bookingTime["_id"],
            "DDMMYYYY",
            "Europe/Oslo"
          )
        };
      });

      this.resHandler.sendResponse(
        res,
        new BlapiResponse([cleanedBookingTimes])
      );
      return true;
    }
    return false;
  }
}
