/**
 * Describe the cause of an event for the analytics service.
 */
export interface IAnalyticsActionCause {
  /**
   * The name of the event. Should be unique for each event.<br/>
   * Eg : searchBoxSubmit or resultSort
   */
  name: string;
  /**
   * The type of the event. Allows to regroup similar event types together when doing reporting.<br/>
   * For example, all search box events will be of type "search box"
   */
  type: string;
  metaMap?: { [name: string]: number };
}

export interface IAnalyticsNoMeta {
}

export interface IAnalyticsInterfaceChange {
  interfaceChangeTo: string;
}

export interface IAnalyticsContextAddMeta {
  contextName: string;
}

export interface IAnalyticsContextRemoveMeta {
  contextName: string;
}

export interface IAnalyticsResultsSortMeta {
  resultsSortBy: string;
}

/**
 * The expected metadata when logging a click event / document view
 */
export interface IAnalyticsDocumentViewMeta {
  /**
   * The url of the clicked document.
   */
  documentURL?: string;
  /**
   * The title of the clicked document.
   */
  documentTitle?: string;
  /**
   * The author of the clicked document.
   */
  author: string;
}

export interface IAnalyticsOmniboxFacetMeta {
  facetId: string;
  facetTitle: string;
  facetValue?: string;
  suggestions: string;
  suggestionRanking: number;
  query: string;
}

export interface IAnalyticsFacetMeta {
  facetId: string;
  facetValue?: string;
  facetTitle: string;
}

export interface IAnalyticsQueryErrorMeta {
  query: string;
  aq: string;
  cq: string;
  dq: string;
  errorType: string;
  errorMessage: string;
}

export interface IAnalyticsTopSuggestionMeta {
  suggestionRanking: number;
  partialQueries: string;
  suggestions: string;
  partialQuery: string;
}

export interface IAnalyticsOmniboxSuggestionMeta {
  suggestionRanking: number;
  partialQueries: string;
  suggestions: string;
  partialQuery: string;
}

export interface IAnalyticsFacetSliderChangeMeta {
  facetId: string;
  facetRangeStart: any;
  facetRangeEnd: any;
}

export interface IAnalyticsFacetGraphSelectedMeta extends IAnalyticsFacetSliderChangeMeta {
}

export interface IAnalyticsFacetOperatorMeta extends IAnalyticsFacetMeta {
  facetOperatorBefore: string;
  facetOperatorAfter: string;
}

export interface IAnalyticsPreferencesChangeMeta {
  preferenceName: string;
  preferenceType: string;
}

export interface IAnalyticsCustomFiltersChangeMeta {
  customFilterName: string;
  customFilterType: string;
  customFilterExpression: string;
}

export interface IAnalyticsCaseAttachMeta {
  resultUriHash: string;
  articleID: string;
  caseID: string;
  author: string;
}

export interface IAnalyticsCaseContextAddMeta {
  caseID: string;
}

export interface IAnalyticsCaseContextRemoveMeta {
  caseID: string;
}

export interface IAnalyticsCaseDetachMeta extends IAnalyticsCaseAttachMeta {
}

export interface IAnalyticsCaseCreationInputChangeMeta {
  inputTitle: string;
  input: string;
  value: string;
}

export interface IAnalyticsCaseCreationDeflectionMeta {
  hasClicks: boolean;
  values: { [field: string]: string };
}

export interface IAnalyticsPagerMeta {
  pagerNumber: number;
}

export interface IAnalyticsResultsPerPageMeta {
  currentResultsPerPage: number;
}

export interface IAnalyticsTriggerNotify {
  notification: string;
}

export interface IAnalyticsTriggerRedirect {
  redirectedTo: string;
}

export interface IAnalyticsTriggerQuery {
  query: string;
}

export interface IAnalyticsTriggerExecute {
  executed: string;
}

export var analyticsActionCauseList = {
  interfaceLoad: <IAnalyticsActionCause>{
    name: 'interfaceLoad',
    type: 'interface'
  },
  interfaceChange: <IAnalyticsActionCause>{
    name: 'interfaceChange',
    type: 'interface',
    metaMap: { interfaceChangeTo: 1 }
  },
  contextRemove: <IAnalyticsActionCause>{
    name: 'contextRemove',
    type: 'misc',
    metaMap: { contextName: 1 }
  },
  didyoumeanAutomatic: <IAnalyticsActionCause>{
    name: 'didyoumeanAutomatic',
    type: 'misc'
  },
  didyoumeanClick: <IAnalyticsActionCause>{
    name: 'didyoumeanClick',
    type: 'misc'
  },
  resultsSort: <IAnalyticsActionCause>{
    name: 'resultsSort',
    type: 'misc',
    metaMap: { resultsSortBy: 1 }
  },
  searchboxSubmit: <IAnalyticsActionCause>{
    name: 'searchboxSubmit',
    type: 'search box'
  },
  searchboxClear: <IAnalyticsActionCause>{
    name: 'searchboxClear',
    type: 'search box'
  },
  searchboxAsYouType: <IAnalyticsActionCause>{
    name: 'searchboxAsYouType',
    type: 'search box'
  },
  breadcrumbFacet: <IAnalyticsActionCause>{
    name: 'breadcrumbFacet',
    type: 'breadcrumb',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  breadcrumbResetAll: <IAnalyticsActionCause>{
    name: 'breadcrumbResetAll',
    type: 'breadcrumb',
  },
  documentTag: <IAnalyticsActionCause>{
    name: 'documentTag',
    type: 'document',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  documentField: <IAnalyticsActionCause>{
    name: 'documentField',
    type: 'document',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  documentQuickview: <IAnalyticsActionCause>{
    name: 'documentQuickview',
    type: 'document',
    metaMap: { documentTitle: 1, documentURL: 2 }
  },
  documentOpen: <IAnalyticsActionCause>{
    name: 'documentOpen',
    type: 'document',
    metaMap: { documentTitle: 1, documentURL: 2 }
  },
  omniboxFacetSelect: <IAnalyticsActionCause>{
    name: 'omniboxFacetSelect',
    type: 'omnibox',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  omniboxFacetExclude: <IAnalyticsActionCause>{
    name: 'omniboxFacetExclude',
    type: 'omnibox',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  omniboxFacetDeselect: <IAnalyticsActionCause>{
    name: 'omniboxFacetDeselect',
    type: 'omnibox',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  omniboxFacetUnexclude: <IAnalyticsActionCause>{
    name: 'omniboxFacetUnexclude',
    type: 'omnibox',
    metaMap: { faceId: 1, facetValue: 2, facetTitle: 3 }
  },
  omniboxAnalytics: <IAnalyticsActionCause>{
    name: 'omniboxAnalytics',
    type: 'omnibox',
    metaMap: {
      partialQuery: 1,
      suggestionRanking: 2,
      partialQueries: 3,
      suggestions: 4
    }
  },
  omniboxField: <IAnalyticsActionCause>{
    name: 'omniboxField',
    type: 'omnibox'
  },
  facetClearAll: <IAnalyticsActionCause>{
    name: 'facetClearAll',
    type: 'facet',
    metaMap: { facetId: 1 }
  },
  facetSearch: <IAnalyticsActionCause>{
    name: 'facetSearch',
    type: 'facet',
    metaMap: { facetId: 1 }
  },
  facetToggle: <IAnalyticsActionCause>{
    name: 'facetToggle',
    type: 'facet',
    metaMap: { facetId: 1, facetOperatorBefore: 2, facetOperatorAfter: 3 }
  },
  facetRangeSlider: <IAnalyticsActionCause>{
    name: 'facetRangeSlider',
    type: 'facet',
    metaMap: { facetId: 1, facetRangeStart: 2, facetRangeEnd: 3 }
  },
  facetRangeGraph: <IAnalyticsActionCause>{
    name: 'facetRangeGraph',
    type: 'facet',
    metaMap: { facetId: 1, facetRangeStart: 2, facetRangeEnd: 3 }
  },
  facetSelect: <IAnalyticsActionCause>{
    name: 'facetSelect',
    type: 'facet',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  facetSelectAll: <IAnalyticsActionCause>{
    name: 'facetSelectAll',
    type: 'facet',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  facetDeselect: <IAnalyticsActionCause>{
    name: 'facetDeselect',
    type: 'facet',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  facetExclude: <IAnalyticsActionCause>{
    name: 'facetExclude',
    type: 'facet',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  facetUnexclude: <IAnalyticsActionCause>{
    name: 'facetUnexclude',
    type: 'facet',
    metaMap: { facetId: 1, facetValue: 2, facetTitle: 3 }
  },
  errorBack: <IAnalyticsActionCause>{
    name: 'errorBack',
    type: 'errors'
  },
  errorClearQuery: <IAnalyticsActionCause>{
    name: 'errorClearQuery',
    type: 'errors'
  },
  errorRetry: <IAnalyticsActionCause>{
    name: 'errorRetry',
    type: 'errors'
  },
  noResultsBack: <IAnalyticsActionCause>{
    name: 'noResultsBack',
    type: 'noResults'
  },
  expandToFullUI: <IAnalyticsActionCause>{
    name: 'expandToFullUI',
    type: 'interface'
  },
  caseCreationInputChange: <IAnalyticsActionCause>{
    name: 'inputChange',
    type: 'caseCreation'
  },
  caseCreationSubmitButton: <IAnalyticsActionCause>{
    name: 'submitButton',
    type: 'caseCreation'
  },
  caseCreationCancelButton: <IAnalyticsActionCause>{
    name: 'cancelButton',
    type: 'caseCreation'
  },
  caseCreationUnloadPage: <IAnalyticsActionCause>{
    name: 'unloadPage',
    type: 'caseCreation'
  },
  casecontextAdd: <IAnalyticsActionCause>{
    name: 'casecontextAdd',
    type: 'casecontext',
    metaMap: { caseID: 5 }
  },
  casecontextRemove: <IAnalyticsActionCause>{
    name: 'casecontextRemove',
    type: 'casecontext',
    metaMap: { caseID: 5 }
  },
  preferencesChange: <IAnalyticsActionCause>{
    name: 'preferencesChange',
    type: 'preferences',
    metaMap: { preferenceName: 1, preferenceType: 2 }
  },
  getUserHistory: <IAnalyticsActionCause>{
    name: 'getUserHistory',
    type: 'userHistory'
  },
  userActionDocumentClick: <IAnalyticsActionCause>{
    name: 'userActionDocumentClick',
    type: 'userHistory'
  },
  caseAttach: <IAnalyticsActionCause>{
    name: 'caseAttach',
    type: 'case',
    metaMap: { documentTitle: 1, resultUriHash: 3, articleID: 4, caseID: 5 }
  },
  caseDetach: <IAnalyticsActionCause>{
    name: 'caseDetach',
    type: 'case',
    metaMap: { documentTitle: 1, resultUriHash: 3, articleID: 4, caseID: 5 }
  },
  customfiltersChange: <IAnalyticsActionCause>{
    name: 'customfiltersChange',
    type: 'customfilters',
    metaMap: { customFilterName: 1, customFilterType: 2, customFilterExpression: 3 }
  },
  pagerNumber: <IAnalyticsActionCause>{
    name: 'pagerNumber',
    type: 'getMoreResults',
    metaMap: { 'pagerNumber': 1 }
  },
  pagerNext: <IAnalyticsActionCause>{
    name: 'pagerNext',
    type: 'getMoreResults',
    metaMap: { 'pagerNumber': 1 }
  },
  pagerPrevious: <IAnalyticsActionCause>{
    name: 'pagerPrevious',
    type: 'getMoreResults',
    metaMap: { 'pagerNumber': 1 }
  },
  pagerScrolling: <IAnalyticsActionCause>{
    name: 'pagerScrolling',
    type: 'getMoreResults'
  },
  pagerResize: <IAnalyticsActionCause>{
    name: 'pagerResize',
    type: 'getMoreResults'
  },
  searchFromLink: <IAnalyticsActionCause>{
    name: 'searchFromLink',
    type: 'interface'
  },
  triggerNotify: <IAnalyticsActionCause>{
    name: 'notify',
    type: 'queryPipelineTriggers'
  },
  triggerExecute: <IAnalyticsActionCause>{
    name: 'execute',
    type: 'queryPipelineTriggers'
  },
  triggerQuery: <IAnalyticsActionCause>{
    name: 'query',
    type: 'queryPipelineTriggers'
  },
  triggerRedirect: <IAnalyticsActionCause>{
    name: 'redirect',
    type: 'queryPipelineTriggers'
  },
  queryError: <IAnalyticsActionCause>{
    name: 'query',
    type: 'errors',
    metaMap: { 'query': 1, 'aq': 2, 'cq': 3, 'dq': 4, 'errorType': 5, 'errorMessage': 6 }
  },
  exportToExcel: <IAnalyticsActionCause>{
    name: 'exportToExcel',
    type: 'misc'
  },
  recommendation: <IAnalyticsActionCause>{
    name: 'recommendation',
    type: 'recommendation'
  },
  recommendationInterfaceLoad: <IAnalyticsActionCause>{
    name: 'recommendationInterfaceLoad',
    type: 'recommendation'
  },
  recommendationOpen: <IAnalyticsActionCause>{
    name: 'recommendationOpen',
    type: 'recommendation'
  },
  advancedSearch: <IAnalyticsActionCause>{
    name: 'advancedSearch',
    type: 'advancedSearch'
  }
};
