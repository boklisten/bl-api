import {SEDbQuery} from './se.db-query';
import {DbQueryNumberFilter} from './number-filter/db-query-number-filter';
import {DbQueryStringFilter} from './string-filter/db-query-string-filter';
import {DbQueryObjectIdFilter} from './object-id-filter/db-query-object-id-filter';
import {DbQueryLimitFilter} from './limit-filter/db-query-limit-filter';
import {DbQueryOnlyGetFilter} from './only-get-filter/db-query-only-get-filter';
import {DbQueryRegexFilter} from './regex-filter/db-query-regex-filter';
import {DbQuerySkipFilter} from './skip-filter/db-query-skip-filter';
import {DbQuerySortFilter} from './sort-filter/db-query-sort-filter';
import {
  DbQueryValidParams,
  ValidParam,
} from './valid-param/db-query-valid-params';
import {DbQueryBooleanFilter} from './boolean-filter/db-query-boolean-filter';
import {DbQueryDateFilter} from './date-filter/db-query-date-filter';
import {DbQueryExpandFilter} from './expand-filter/db-query-expand-filter';

export class SEDbQueryBuilder {
  private dbQueryBooleanFilter: DbQueryBooleanFilter;
  private dbQueryDateFilter: DbQueryDateFilter;
  private dbQueryLimitFilter: DbQueryLimitFilter;
  private dbQueryNumberFilter: DbQueryNumberFilter;
  private dbQueryOnlyGetFilter: DbQueryOnlyGetFilter;
  private dbQueryRegexFilter: DbQueryRegexFilter;
  private dbQuerySkipFilter: DbQuerySkipFilter;
  private dbQuerySortFilter: DbQuerySortFilter;
  private dbQueryStringFilter: DbQueryStringFilter;
  private dbQueryObjectIdFilter: DbQueryObjectIdFilter;
  private dbQueryExpandFilter: DbQueryExpandFilter;
  private dbQueryValidParams: DbQueryValidParams;

  constructor() {
    this.dbQueryBooleanFilter = new DbQueryBooleanFilter();
    this.dbQueryDateFilter = new DbQueryDateFilter();
    this.dbQueryLimitFilter = new DbQueryLimitFilter();
    this.dbQueryNumberFilter = new DbQueryNumberFilter();
    this.dbQueryOnlyGetFilter = new DbQueryOnlyGetFilter();
    this.dbQueryRegexFilter = new DbQueryRegexFilter();
    this.dbQuerySkipFilter = new DbQuerySkipFilter();
    this.dbQuerySortFilter = new DbQuerySortFilter();
    this.dbQueryStringFilter = new DbQueryStringFilter();
    this.dbQueryObjectIdFilter = new DbQueryObjectIdFilter();
    this.dbQueryExpandFilter = new DbQueryExpandFilter();
  }

  public getDbQuery(query: any, validQueryParams: ValidParam[]): SEDbQuery {
    this.dbQueryValidParams = new DbQueryValidParams(validQueryParams);

    let dbQuery: SEDbQuery = new SEDbQuery();

    if (
      !query ||
      (Object.keys(query).length === 0 && query.constructor === Object)
    ) {
      return dbQuery;
    }

    try {
      dbQuery.booleanFilters = this.dbQueryBooleanFilter.getBooleanFilters(
        query,
        this.dbQueryValidParams.getValidBooleanParams(),
      );
      dbQuery.dateFilters = this.dbQueryDateFilter.getDateFilters(
        query,
        this.dbQueryValidParams.getValidDateParams(),
      );
      dbQuery.limitFilter = this.dbQueryLimitFilter.getLimitFilter(query);
      dbQuery.numberFilters = this.dbQueryNumberFilter.getNumberFilters(
        query,
        this.dbQueryValidParams.getValidNumberParams(),
      );
      dbQuery.onlyGetFilters = this.dbQueryOnlyGetFilter.getOnlyGetFilters(
        query,
        this.dbQueryValidParams.getAllValidParams(),
      );
      dbQuery.regexFilters = this.dbQueryRegexFilter.getRegexFilters(
        query,
        this.dbQueryValidParams.getValidStringParams(),
      );
      dbQuery.skipFilter = this.dbQuerySkipFilter.getSkipFilter(query);
      dbQuery.sortFilters = this.dbQuerySortFilter.getSortFilters(
        query,
        this.dbQueryValidParams.getAllValidParams(),
      );
      dbQuery.stringFilters = this.dbQueryStringFilter.getStringFilters(
        query,
        this.dbQueryValidParams.getValidStringParams(),
      );
      dbQuery.objectIdFilters = this.dbQueryObjectIdFilter.getObjectIdFilters(
        query,
        this.dbQueryValidParams.getValidObjectIdParams(),
      );
      dbQuery.expandFilters = this.dbQueryExpandFilter.getExpandFilters(
        query,
        this.dbQueryValidParams.getValidExpandParams(),
      );
    } catch (error) {
      if (error instanceof TypeError)
        throw new TypeError(
          'TypeError when building query, reason: ' + error.message,
        );
      if (error instanceof ReferenceError)
        throw new ReferenceError(
          'ReferenceError when building query, reason: ' + error.message,
        );
      if (error instanceof RangeError)
        throw new RangeError(
          'RangeError when building query, reason: ' + error.message,
        );
      throw new Error('Error when building query, reason: ' + error.message);
    }

    return dbQuery;
  }
}
