import { BlError } from "@boklisten/bl-model";
const querystring = require("querystring");
const qs = require("qs");
const request = require("request");
const rp = require("request-promise");
import { logger } from "../logger/logger";

export class HttpHandler {
  constructor() {}

  post(url: string, data: any, authorization?: string): Promise<string> {
    return new Promise((resolve, reject) => {
      const options = {
        url: url,
        json: data,
        headers: {},
      };

      if (authorization) {
        options["headers"]["Authorization"] = authorization;
      }

      logger.debug(`R-> POST ${url}`);

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
              `the request to "${url}" responded with status ${res.statusCode}`
            ).store("body", body)
          );
        }
      });
    });
  }

  public getWithQuery(
    url: string,
    queryString: string,
    headers?: object
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      let options = {
        uri: url + "?" + queryString,
        json: true,
        headers: headers,
      };

      logger.debug(`R-> GET ${options.uri}`);

      rp(options)
        .then((jsonResponse) => {
          resolve(jsonResponse);
        })
        .catch((error) => {
          logger.verbose(`<-R ERROR ${error}`);

          reject(
            new BlError("could not get page with query")
              .store("responseError", error)
              .store("uri", url + "?" + queryString)
          );
        });
    });
  }

  public get(url: string, authorization?: string): Promise<any> {
    return new Promise((resolve, reject) => {
      let options = {
        uri: url,
        json: true,
        headers: {},
      };

      if (authorization) {
        options["headers"]["Authorization"] = authorization;
      }

      logger.debug(`R-> GET ${options.uri}`);

      rp(options)
        .then((jsonResponse) => {
          resolve(jsonResponse);
        })
        .catch((error) => {
          logger.verbose(`<-R ERROR ${error}`);

          reject(
            new BlError(
              `could not get the requested resource at "${url}"`
            ).store("error", error)
          );
        });
    });
  }

  public createQueryString(data: any): string {
    return qs.stringify(data);
  }
}
