/* eslint-disable @typescript-eslint/no-var-requires */
import { BlError } from "@boklisten/bl-model";
import { stringify } from "qs";

import { logger } from "../logger/logger";

const request = require("request");
const rp = require("request-promise");

export class HttpHandler {
  post(url: string, data: unknown, authorization?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        url: url,
        json: data,
        headers: {},
      };

      if (authorization) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options["headers"]["Authorization"] = authorization;
      }

      logger.debug(`R-> POST ${url}`);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      request.post(options, (err, res, body) => {
        if (err) {
          logger.verbose(`<-R ERROR ${err}`);
          return reject(new BlError(`error on request to "${url}"`));
        }

        if (res && res.statusCode) {
          if (res.statusCode == 200 || res.statusCode === 201) {
            return resolve(body);
          }

          logger.verbose(`<-R ERROR ${err}`);

          return reject(
            new BlError(
              `the request to "${url}" responded with status ${res.statusCode}`,
            ).store("body", body),
          );
        }
      });
    });
  }

  public getWithQuery(
    url: string,
    queryString: string,
    headers?: object,
  ): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const options = {
        uri: url + "?" + queryString,
        json: true,
        headers: headers,
      };

      logger.debug(`R-> GET ${options.uri}`);

      rp(options)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .then((jsonResponse) => {
          resolve(jsonResponse);
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .catch((error) => {
          logger.verbose(`<-R ERROR ${error}`);

          reject(
            new BlError("could not get page with query")
              .store("responseError", error)
              .store("uri", url + "?" + queryString),
          );
        });
    });
  }

  public get(url: string, authorization?: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const options = {
        uri: url,
        json: true,
        headers: {},
      };

      if (authorization) {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        options["headers"]["Authorization"] = authorization;
      }

      logger.debug(`R-> GET ${options.uri}`);

      rp(options)
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .then((jsonResponse) => {
          resolve(jsonResponse);
        })
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        .catch((error) => {
          logger.verbose(`<-R ERROR ${error}`);

          reject(
            new BlError(
              `could not get the requested resource at "${url}"`,
            ).store("error", error),
          );
        });
    });
  }

  public createQueryString(data: unknown): string {
    return stringify(data);
  }
}
