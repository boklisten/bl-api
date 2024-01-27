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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    blApiRequest: BlApiRequest,
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    req?: Request,
    res?: Response,
  ): Promise<boolean> {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.writeHead(200, {
      "Content-Type": "application/pdf",
    });

    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore
    res.end(await generateBlIdPDF());
    return true;
  }
}
