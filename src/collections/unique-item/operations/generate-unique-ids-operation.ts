import { Request, Response } from "express";

import { Operation } from "../../../operation/operation";
import { BlApiRequest } from "../../../request/bl-api-request";
import { SEResponseHandler } from "../../../response/se.response.handler";
import generateBlIdPDF from "../helpers/bl-id-generator";

export class GenerateUniqueIdsOperation implements Operation {
  constructor(private resHandler?: SEResponseHandler) {
    this.resHandler ??= new SEResponseHandler();
  }

  async run(
    blApiRequest: BlApiRequest,
    req?: Request,
    res?: Response,
  ): Promise<boolean> {
    res.writeHead(200, {
      "Content-Type": "application/pdf",
    });

    res.end(await generateBlIdPDF());
    return true;
  }
}
