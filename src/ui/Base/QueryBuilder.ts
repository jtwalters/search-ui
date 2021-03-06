import { ExpressionBuilder } from './ExpressionBuilder';
import { QueryUtils } from '../../utils/QueryUtils';
import { IRankingFunction } from '../../rest/RankingFunction';
import { IQueryFunction } from '../../rest/QueryFunction';
import { IGroupByRequest } from '../../rest/GroupByRequest';
import { IQuery } from '../../rest/Query';
import _ = require('underscore');

/**
 * Describe the expressions part of a QueryBuilder.
 */
export interface IQueryBuilderExpression {
  /**
   * The whole expression
   */
  full?: string;
  /**
   * The full part, but without the constant.
   */
  withoutConstant?: string;
  /**
   * The constant part of the expression
   */
  constant?: string;
  /**
   * The basic part of the expression
   */
  basic?: string;
  /**
   * The advanced part of the expression
   */
  advanced?: string;
}

/**
 * The QueryBuilder is used to build a {@link IQuery} that will be able to be executed using the Search API.<br/>
 * The class exposes several members and methods that help components and external code to build up the final query that is sent to the Search API.<br/>
 */
export class QueryBuilder {
  /**
   * Used to build the basic part of the query expression.<br/>
   * This part typically consists of user-entered content such as query keywords, etc.
   * @type {Coveo.ExpressionBuilder}
   */
  public expression: ExpressionBuilder = new ExpressionBuilder();
  /**
   * Used to build the advanced part of the query expression.<br/>
   * This part is typically formed of filter expressions generated by components such as facets, external code, etc.
   * @type {Coveo.ExpressionBuilder}
   */
  public advancedExpression: ExpressionBuilder = new ExpressionBuilder();
  /**
   * Used to build the advanced part of the query expression.<br/>
   * This part is similar to `advancedExpression`, but its content is interpreted as a constant expression by the index and it takes advantage of special caching features.
   * @type {Coveo.ExpressionBuilder}
   */
  public constantExpression: ExpressionBuilder = new ExpressionBuilder();
  /**
   * The contextual text.<br/>
   * This is the contextual text part of the query. It uses Reveal to pick key keywords from the text and add them to the basic expression.
   * This field is mainly used to pass context such a case description, long textual query or any other form of text that might help in
   * refining the query.
   */
  public longQueryExpression: ExpressionBuilder = new ExpressionBuilder();
  /**
   * Used to build the disjunctive part of the query expression.<br/>
   * When present, this part is evaluated separately from the other expressions and the matching results are merged to those matching expressions, `advancedExpression` and `constantExpression`.<br/>
   * The final boolean expression for the query is thus (basic advanced constant) OR (disjunction).
   * @type {Coveo.ExpressionBuilder}
   */
  public disjunctionExpression: ExpressionBuilder = new ExpressionBuilder();
  /**
   * The hub value set from the {@link Analytics} component.<br/>
   * Used for analytics reporting in the Coveo platform.
   */
  public searchHub: string;
  /**
   * The tab value set from the {@link Tab} component.
   */
  public tab: string;
  public language: string;
  /**
   * Name of the query pipeline to use.<br/>
   * This specifies the name of the query pipeline to use for the query. If not specified, the default value is default, which means the default query pipeline will be used.
   */
  public pipeline: string;
  /**
   * The maximum age for cached query results, in milliseconds.<br/>
   * If results for the exact same request (including user identities) are available in the in-memory cache, they will be used if they are not older than the specified value.<br/>
   * Otherwise, the query will be sent to the index.
   */
  public maximumAge: number;
  /**
   * Whether to enable wildcards on the basic expression keywords.<br/>
   * This enables the wildcard features of the index. Coveo Platform will expand keywords containing wildcard characters to the possible matching keywords to broaden the query.<br/>
   * (see : https://onlinehelp.coveo.com/en/ces/7.0/user/using_wildcards_in_queries.htm).<br/>
   * If not specified, this parameter defaults to false.
   */
  public enableWildcards: boolean;
  /**
   * Whether to enable question marks with wildcards.<br/>
   * This enables using the question mark ? character within wildcard expressions.
   */
  public enableQuestionMarks: boolean;
  /**
   * Whether to disable the special query syntax such as field references for the basic query expression (parameter q).
   * It is equivalent to a No syntax block applied to the basic query expression.
   * If not specified, the parameter defaults to false.
   */
  public disableQuerySyntax: boolean = false;
  /**
   * Whether to enable the support for operator in lowercase (AND OR -> and or).
   */
  public enableLowercaseOperators: boolean;
  /**
   * Whether to enable partial matching of the basic expression keywords.<br/>
   * By activating this, when the basic expression contains at least {@link IQuery.partialMatchKeywords}, documents containing only the number of keywords specified by {@link IQuery.partialMatchThreshold} will also match the query.<br/>
   * Without this option, documents are required to contain all the keywords in order to match the query.<br/>
   * If not specified, this parameter defaults to false.
   */
  public enablePartialMatch: boolean;
  /**
   * The minimum number of keywords needed to activate partial match.<br/>
   * This specifies the minimum number of keywords needed for the partial match feature to activate.<br/>
   * If the basic expression contains less than this number of keywords, no transformation is applied on the query.<br/>
   * If not specified, this parameter defaults to 5.
   */
  public partialMatchKeywords: number;
  /**
   * The threshold to use for matching documents when partial match is enabled.<br/>
   * This specifies the minimum number of query keywords that a document must contain when partial match is enabled. This value can either be an absolute number or a percentage value based on the total number of keywords.<br/>
   * If not specified, this parameter defaults to 50%.
   */
  public partialMatchThreshold: string;
  /**
   * This is the 0-based index of the first result to return.<br/>
   * If not specified, this parameter defaults to 0.
   */
  public firstResult: number = 0;
  /**
   * This is the number of results to return, starting from {@link IQuery.firstResult}.<br/>
   * If not specified, this parameter defaults to 10.
   */
  public numberOfResults: number = 10;
  /**
   * This specifies the length (in number of characters) of the excerpts generated by the indexer based on the keywords present in the query.<br/>
   * The index includes the top most interesting sentences (in the order they appear in the document) that fit in the specified number of characters.<br/>
   * When not specified, the default value is 200.
   */
  public excerptLength: number;
  /**
   * This specifies a field on which {@link Folding} should be performed.<br/>
   * Folding is a kind of duplicate filtering where only the first result with any given value of the field is included in the result set.<br/>
   * It's typically used to return only one result in a conversation, for example when forum posts in a thread are indexed as separate items.
   */
  public filterField: string;
  /**
   * Number of results that should be folded, using the {@link IQuery.filterField}.
   */
  public filterFieldRange: number;
  /**
   * Specifies the `parentField` when doing parent-child loading (See : {@link Folding}).
   */
  public parentField: string;
  /**
   * Specifies the childField when doing parent-child loading (See : {@link Folding}).
   */
  public childField: string;
  public fieldsToInclude: string[];
  public requiredFields: string[] = [];
  public includeRequiredFields: boolean = false;
  public fieldsToExclude: string[];
  /**
   * Whether to enable query corrections on this query (see {@link DidYouMean}).
   */
  public enableDidYouMean: boolean = false;
  /**
   * Whether to enable debug info on the query.<br/>
   * This will return additional information on the resulting JSON response from the Search API.<br/>
   * Mostly: execution report (a detailed breakdown of the parsed and executed query).
   */
  public enableDebug: boolean = false;
  /**
   * Whether the index should take collaborative rating in account when ranking result (see : {@link ResultRating}).
   */
  public enableCollaborativeRating: boolean;
  /**
   * This specifies the sort criterion(s) to use to sort results. If not specified, this parameter defaults to relevancy.<br/>
   * Possible values are : <br/>
   * -- relevancy :  This uses all the configured ranking weights as well as any specified ranking expressions to rank results.<br/>
   * -- dateascending / datedescending Sort using the value of the `@date` field, which is typically the last modification date of an item in the index.<br/>
   * -- qre : Sort using only the weights applied through ranking expressions. This is much like using `relevancy` except that automatic weights based on keyword proximity etc, are not computed.<br/>
   * -- nosort : Do not sort the results. The order in which items are returned is essentially random.<br/>
   * -- @field ascending / @field descending Sort using the value of a custom field.
   */
  public sortCriteria: string = 'relevancy';
  public sortField: string;
  public retrieveFirstSentences: boolean = true;
  public timezone: string;
  public queryUid: string = QueryUtils.createGuid();
  /**
   * This specifies an array of Query Function operation that will be executed on the results.
   */
  public queryFunctions: IQueryFunction[] = [];
  /**
   * This specifies an array of Ranking Function operations that will be executed on the results.
   */
  public rankingFunctions: IRankingFunction[] = [];
  /**
   * This specifies an array of Group By operations that can be performed on the query results to extract facets.
   */
  public groupByRequests: IGroupByRequest[] = [];
  public enableDuplicateFiltering: boolean = false;
  /**
   * The context is a map of key_value that can be used in the Query pipeline in the Coveo platform.<br/>
   */
  public context: { [key: string]: any };
  /**
   * The actions history represents the past actions a user made and is used by reveal to suggest recommendations.
   * It is generated by the page view script (https://github.com/coveo/coveo.analytics.js).
   */
  public actionsHistory: string;
  /**
   * This is the ID of the recommendation interface that generated the query.
   */
  public recommendation: string;
  /**
   * Build the current content or state of the query builder and return a {@link IQuery}.<br/>
   * build can be called multiple times on the same QueryBuilder.
   * @returns {IQuery}
   */
  build(): IQuery {
    var query: IQuery = {
      q: this.expression.build(),
      aq: this.advancedExpression.build(),
      cq: this.constantExpression.build(),
      lq: this.longQueryExpression.build(),
      dq: this.disjunctionExpression.build(),

      searchHub: this.searchHub,
      tab: this.tab,
      language: this.language,
      pipeline: this.pipeline,
      maximumAge: this.maximumAge,

      wildcards: this.enableWildcards,
      questionMark: this.enableQuestionMarks,
      lowercaseOperators: this.enableLowercaseOperators,
      partialMatch: this.enablePartialMatch,
      partialMatchKeywords: this.partialMatchKeywords,
      partialMatchThreshold: this.partialMatchThreshold,

      firstResult: this.firstResult,
      numberOfResults: this.numberOfResults,
      excerptLength: this.excerptLength,
      filterField: this.filterField,
      filterFieldRange: this.filterFieldRange,
      parentField: this.parentField,
      childField: this.childField,
      fieldsToInclude: this.computeFieldsToInclude(),
      fieldsToExclude: this.fieldsToExclude,
      enableDidYouMean: this.enableDidYouMean,
      sortCriteria: this.sortCriteria,
      sortField: this.sortField,
      queryFunctions: this.queryFunctions,
      rankingFunctions: this.rankingFunctions,
      groupBy: this.groupByRequests,
      retrieveFirstSentences: this.retrieveFirstSentences,
      timezone: this.timezone,
      disableQuerySyntax: this.disableQuerySyntax,
      enableDuplicateFiltering: this.enableDuplicateFiltering,
      enableCollaborativeRating: this.enableCollaborativeRating,
      debug: this.enableDebug,
      context: this.context,
      actionsHistory: this.actionsHistory,
      recommendation: this.recommendation
    };
    return query;
  }

  /**
   * Return only the expression(s) part(s) of the query, as a string.<br/>
   * This means the basic, advanced and constant part in a complete expression {@link IQuery.q}, {@link IQuery.aq}, {@link IQuery.cq}.
   * @returns {string}
   */
  public computeCompleteExpression(): string {
    return this.computeCompleteExpressionParts().full;
  }

  /**
   * Return only the expression(s) part(s) of the query, as an object.
   * @returns {{full: string, withoutConstant: string, constant: string}}
   */
  public computeCompleteExpressionParts(): IQueryBuilderExpression {
    var withoutConstant = ExpressionBuilder.merge(this.expression, this.advancedExpression);

    return {
      full: ExpressionBuilder.mergeUsingOr(ExpressionBuilder.merge(withoutConstant, this.constantExpression), this.disjunctionExpression).build(),
      withoutConstant: ExpressionBuilder.mergeUsingOr(withoutConstant, this.disjunctionExpression).build(),
      basic: ExpressionBuilder.mergeUsingOr(this.expression, this.disjunctionExpression).build(),
      advanced: ExpressionBuilder.mergeUsingOr(this.advancedExpression, this.disjunctionExpression).build(),
      constant: ExpressionBuilder.mergeUsingOr(this.constantExpression, this.disjunctionExpression).build()
    };
  }

  /**
   * Return only the expression(s) part(s) of the query, as a string, except the given expression.<br/>
   * This is used by {@link Facet}, to build their group by request with query override.
   * @param except
   * @returns {string}
   */
  public computeCompleteExpressionExcept(except: string): string {
    return this.computeCompleteExpressionPartsExcept(except).full;
  }

  /**
   * Return only the expression(s) part(s) of the query, as an object, except the given expression.<br/>
   * This is used by {@link Facet}, to build their group by request with query override.
   * @param except
   * @returns {{full: string, withoutConstant: string, constant: string}}
   */
  public computeCompleteExpressionPartsExcept(except: string): IQueryBuilderExpression {
    var withoutConstantAndExcept = ExpressionBuilder.merge(this.expression, this.advancedExpression);
    withoutConstantAndExcept.remove(except);

    var basicAndExcept = new ExpressionBuilder();
    basicAndExcept.fromExpressionBuilder(this.expression);
    basicAndExcept.remove(except);

    var advancedAndExcept = new ExpressionBuilder();
    advancedAndExcept.fromExpressionBuilder(this.advancedExpression);
    advancedAndExcept.remove(except);

    return {
      full: ExpressionBuilder.mergeUsingOr(ExpressionBuilder.merge(withoutConstantAndExcept, this.constantExpression), this.disjunctionExpression).build(),
      withoutConstant: ExpressionBuilder.mergeUsingOr(withoutConstantAndExcept, this.disjunctionExpression).build(),
      basic: ExpressionBuilder.mergeUsingOr(basicAndExcept, this.disjunctionExpression).build(),
      advanced: ExpressionBuilder.mergeUsingOr(advancedAndExcept, this.disjunctionExpression).build(),
      constant: ExpressionBuilder.mergeUsingOr(this.constantExpression, this.disjunctionExpression).build()
    };
  }

  /**
   * Add fields to specifically include when the results return.<br/>
   * This can be used to accelerate the execution time of every query, as there is much less data to process if you whitelist specific fields.
   * @param fields
   */
  public addFieldsToInclude(fields: string[]) {
    this.fieldsToInclude = _.uniq((this.fieldsToInclude || []).concat(fields));
  }

  public addRequiredFields(fields: string[]) {
    this.requiredFields = _.uniq(this.requiredFields.concat(fields));
  }

  /**
   * Add fields to specifically exclude when the results return.<br/>
   * This can be used to accelerate the execution time of every query, as there is much less data to process if you blacklist specific fields.
   * @param fields
   */
  public addFieldsToExclude(fields: string[]) {
    this.fieldsToExclude = _.uniq((this.fieldsToInclude || []).concat(fields));
  }

  public computeFieldsToInclude() {
    if (this.includeRequiredFields || this.fieldsToInclude != null) {
      return this.requiredFields.concat(this.fieldsToInclude || []);
    } else {
      return null;
    }
  }

  /**
   * Add a single context key->value pair to the query.<br/>
   * This is used by the Query pipeline in the Coveo platform.
   * @param key
   * @param value
   */
  public addContextValue(key: string, value: any) {
    if (this.context == null) {
      this.context = {};
    }
    this.context[key] = value;
  }

  /**
   * Add a context object to the query.<br/>
   * This can contain multiple key->value.<br/>
   * This is used by the Query pipeline in the Coveo platform.
   * @param values
   */
  public addContext(values: { [key: string]: any }) {
    if (this.context == null) {
      this.context = {};
    }
    _.extend(this.context, values);
  }
}
