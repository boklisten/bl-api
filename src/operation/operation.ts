import {BlApiRequest} from "../request/bl-api-request";

export interface Operation {
	run(blApiRequest: BlApiRequest): void
}