/// <reference path="Facet.ts" />

import {IIndexFieldValue} from '../../rest/FieldValue';
import {Facet} from './Facet';
import {$$} from '../../utils/Dom';
import {Utils} from '../../utils/Utils';
import {InitializationEvents} from '../../events/InitializationEvents';
import {DeviceUtils} from '../../utils/DeviceUtils';
import {EventsUtils} from '../../utils/EventsUtils';
import {FacetSearchParameters} from './FacetSearchParameters';
import {IAnalyticsFacetMeta, analyticsActionCauseList} from '../Analytics/AnalyticsActionListMeta';
import {IEndpointError} from '../../rest/EndpointError';
import {Component} from '../Base/Component';
import {DomUtils} from '../../utils/DomUtils';
import {PopupUtils, HorizontalAlignment, VerticalAlignment} from '../../utils/PopupUtils';
import {l} from '../../strings/Strings';
import {Assert} from '../../misc/Assert';
import {KEYBOARD} from '../../utils/KeyboardUtils';
import {FacetUtils} from './FacetUtils';
import {FacetValue} from './FacetValues';
import {StringUtils} from '../../utils/StringUtils';
import {IFacetSearchValuesListKlass} from './FacetSearchValuesList';
import {FacetValueElement} from './FacetValueElement';
import {ModalBox} from '../../ExternalModulesShim';
import {SearchInterface} from '../SearchInterface/SearchInterface';
import {ResponsiveComponentsUtils} from '../ResponsiveComponents/ResponsiveComponentsUtils';
import {FacetValuesOrder} from './FacetValuesOrder';

/**
 * Used by the {@link Facet} component to render and handle the facet search part of each facet.
 */
export class FacetSearch {
  public currentlyDisplayedResults: string[];
  public searchResults: HTMLElement;
  public search: HTMLElement;

  private magnifier: HTMLElement;
  private wait: HTMLElement;
  private clearIcon: HTMLElement;
  private clear: HTMLElement;
  private middle: HTMLElement;
  private input: HTMLInputElement;
  private facetSearchTimeout: number;
  private showingFacetSearchWaitAnimation = false;
  private facetSearchPromise: Promise<IIndexFieldValue[]>;
  private moreValuesToFetch = true;
  private onResize: (...args: any[]) => void;
  private onDocumentClick: (e: Event) => void;
  private searchBarIsAnimating: boolean = false;

  constructor(public facet: Facet, public facetSearchValuesListKlass: IFacetSearchValuesListKlass, private root: HTMLElement) {
    this.searchResults = document.createElement('ul');
    $$(this.searchResults).addClass('coveo-facet-search-results');
    this.onResize = _.debounce(() => {
      // Mitigate issues in UT where the window in phantom js might get resized in the scope of another test.
      // These would point to random instance of a test karma object, and not a real search interface.
      if (this.facet instanceof Facet && this.facet.searchInterface instanceof SearchInterface) {
        if (this.shouldPositionSearchResults()) {
          this.positionSearchResults();
        }
      }
    }, 250);
    this.onDocumentClick = (e: Event) => {
      this.handleClickElsewhere(e);
    };
    window.addEventListener('resize', () => this.onResize());
    document.addEventListener('click', (e: Event) => this.onDocumentClick(e));
    $$(facet.root).on(InitializationEvents.nuke, () => this.handleNuke());
  }

  public isMobileDevice() {
    return DeviceUtils.isMobileDevice() && !this.facet.searchInterface.isNewDesign();
  }

  /**
   * Build the search component and return an `HTMLElement` which can be appended to the {@link Facet}.
   * @returns {HTMLElement}
   */
  public build(): HTMLElement {
    if (this.isMobileDevice()) {
      return this.buildSearchMobile();
    } else {
      return this.buildBaseSearch();
    }
  }

  /**
   * Position the search results at the footer of the facet.
   */
  public positionSearchResults(nextTo: HTMLElement = this.search) {
    if (this.searchResults != null) {
      if (!this.isMobileDevice()) {
        this.searchResults.style.display = 'block';
        this.searchResults.style.width = this.facet.element.clientWidth - 40 + 'px';
      }

      if ($$(this.searchResults).css('display') == 'none') {
        this.searchResults.style.display = '';
      }
      let searchBar = $$(this.search);
      if (searchBar.css('display') == 'none' || this.searchBarIsAnimating) {
        if ($$(this.searchResults).css('display') == 'none') {
          this.searchResults.style.display = '';
        }
        let self = this;
        EventsUtils.addPrefixedEvent(this.search, 'AnimationEnd', function (evt) {
          PopupUtils.positionPopup(self.searchResults, nextTo, self.root,
            { horizontal: HorizontalAlignment.CENTER, vertical: VerticalAlignment.BOTTOM }
          );
          EventsUtils.removePrefixedEvent(self.search, 'AnimationEnd', this);
        });
      } else {
        PopupUtils.positionPopup(this.searchResults, nextTo, this.root,
          { horizontal: HorizontalAlignment.CENTER, vertical: VerticalAlignment.BOTTOM }
        );
      }
    }
  }

  /**
   * Dismiss the search results
   */
  public completelyDismissSearch() {
    this.cancelAnyPendingSearchOperation();
    this.facet.unfadeInactiveValuesInMainList();
    $$(this.searchResults).empty();
    this.moreValuesToFetch = true;
    $$(this.search).removeClass('coveo-facet-search-no-results');
    $$(this.facet.element).removeClass('coveo-facet-searching');
    this.hideSearchResultsElement();
    this.input.value = '';
    $$(this.clear).hide();
    this.currentlyDisplayedResults = undefined;
  }

  /**
   * Trigger a new facet search, and display the results.
   * @param params
   */
  public triggerNewFacetSearch(params: FacetSearchParameters) {
    this.cancelAnyPendingSearchOperation();
    this.showFacetSearchWaitingAnimation();

    this.facet.logger.info('Triggering new facet search');

    this.facetSearchPromise = this.facet.facetQueryController.search(params);

    if (this.facetSearchPromise) {
      this.facetSearchPromise.then((fieldValues: IIndexFieldValue[]) => {
        this.facet.usageAnalytics.logCustomEvent<IAnalyticsFacetMeta>(analyticsActionCauseList.facetSearch, {
          facetId: this.facet.options.id,
          facetTitle: this.facet.options.title
        }, this.facet.root);
        this.facet.logger.debug('Received field values', fieldValues);
        this.processNewFacetSearchResults(fieldValues, params);
        this.hideFacetSearchWaitingAnimation();
        this.facetSearchPromise = undefined;
      });

      this.facetSearchPromise.catch((error: IEndpointError) => {
        // The request might be normally cancelled if another search is triggered.
        // In this case we do not hide the animation to prevent flicking.
        if (Utils.exists(error)) {
          this.facet.logger.error('Error while retrieving facet values', error);
          this.hideFacetSearchWaitingAnimation();
        }
        this.facetSearchPromise = undefined;
      });
    }
  }

  /**
   * Trigger the event associated with the focus of the search input.
   */
  public focus(): void {
    this.input.focus();
    this.handleFacetSearchFocus();
  }

  private shouldPositionSearchResults(): boolean {
    return !this.isMobileDevice() && !ResponsiveComponentsUtils.isSmallFacetActivated($$(this.root))
      && $$(this.facet.element).hasClass('coveo-facet-searching');
  }

  private buildBaseSearch(): HTMLElement {
    this.search = document.createElement('div');
    $$(this.search).addClass('coveo-facet-search');

    this.magnifier = document.createElement('div');
    $$(this.magnifier).addClass('coveo-facet-search-magnifier');
    this.search.appendChild(this.magnifier);

    this.wait = document.createElement('div');
    $$(this.wait).addClass('coveo-facet-search-wait-animation');
    this.search.appendChild(this.wait);
    this.hideFacetSearchWaitingAnimation();

    this.clear = document.createElement('div');
    $$(this.clear).addClass('coveo-facet-search-clear');
    this.clear.setAttribute('title', l('Clear', l('Search')));
    this.clear.style.display = 'none';
    this.search.appendChild(this.clear);


    this.clearIcon = document.createElement('span');
    $$(this.clearIcon).addClass('coveo-icon');
    this.clear.appendChild(this.clearIcon);

    this.middle = document.createElement('div');
    $$(this.middle).addClass('coveo-facet-search-middle');
    this.search.appendChild(this.middle);

    this.input = document.createElement('input');
    this.input.setAttribute('type', 'text');
    this.input.setAttribute('autocapitalize', 'off');
    this.input.setAttribute('autocorrect', 'off');
    this.input.setAttribute('placeholder', this.facet.searchInterface.isNewDesign() ? '' : l('SearchIn', this.facet.options.title));
    $$(this.input).addClass('coveo-facet-search-input');
    Component.pointElementsToDummyForm(this.input);
    this.middle.appendChild(this.input);

    $$(this.input).on('keyup', (e: KeyboardEvent) => this.handleFacetSearchKeyUp(e));
    $$(this.clear).on('click', (e: Event) => this.handleFacetSearchClear());
    $$(this.input).on('focus', (e: Event) => this.handleFacetSearchFocus());

    this.detectSearchBarAnimation();
    this.root.appendChild(this.searchResults);
    this.searchResults.style.display = 'none';

    return this.search;
  }

  private buildSearchMobile() {
    let button = document.createElement('div');
    $$(button).addClass('coveo-facet-search-button-mobile');
    $$(button).text(l('Search'));
    this.search = this.buildBaseSearch();
    $$(button).on('click', () => {
      let toOpen = document.createElement('div');
      toOpen.appendChild(this.search);

      ModalBox.open(toOpen, {
        title: DomUtils.getPopUpCloseButton(l('Close'), l('SearchIn', this.facet.options.title)),
        validation: () => {
          this.completelyDismissSearch();
          return true;
        },
        className: 'coveo-mobile-facet-search',
        titleClose: true
      });
      this.input.value = '';
      this.input.focus();
    });
    return button;
  }

  private handleFacetSearchKeyUp(event: KeyboardEvent) {
    Assert.exists(event);
    let isEmpty = this.input.value == '';
    this.showOrHideClearElement(isEmpty);

    if (!this.isMobileDevice()) {
      this.handleKeyboardNavigation(event, isEmpty);
    } else {
      this.startNewSearchTimeout(this.buildParamsForNormalSearch());
    }
  }

  private handleNuke() {
    window.removeEventListener('resize', this.onResize);
    document.removeEventListener('click', this.onDocumentClick);
  }


  private handleFacetSearchFocus() {
    if (!this.isMobileDevice()) {
      if (this.facet.searchInterface.isNewDesign()) {
        this.startNewSearchTimeout(this.buildParamsForExcludingCurrentlyDisplayedValues());
      } else {
        this.startNewSearchTimeout(this.buildParamsForNormalSearch());
      }
    }
  }

  private handleClickElsewhere(event: Event) {
    if (this.currentlyDisplayedResults && !this.isMobileDevice() && this.search != event.target && this.searchResults != event.target) {
      this.completelyDismissSearch();
    }
  }

  private handleFacetSearchClear() {
    this.input.value = '';
    $$(this.clear).hide();
    this.completelyDismissSearch();
  }

  private showOrHideClearElement(isEmpty: boolean) {
    if (!isEmpty) {
      $$(this.clear).show();
    } else {
      $$(this.clear).hide();
      $$(this.search).removeClass('coveo-facet-search-no-results');
    }
  }

  private handleKeyboardNavigation(event: KeyboardEvent, isEmpty: boolean) {
    switch (event.which) {
      case KEYBOARD.ENTER:
        this.keyboardNavigationEnterPressed(event, isEmpty);
        break;
      case KEYBOARD.DELETE:
        this.keyboardNavigationDeletePressed(event);
        break;
      case KEYBOARD.ESCAPE:
        this.completelyDismissSearch();
        break;
      case KEYBOARD.DOWN_ARROW:
        this.moveCurrentResultDown();
        break;
      case KEYBOARD.UP_ARROW:
        this.moveCurrentResultUp();
        break;
      default:
        this.moreValuesToFetch = true;
        this.highlightCurrentQueryWithinSearchResults();
        this.startNewSearchTimeout(this.buildParamsForNormalSearch());
        break;
    }
  }

  private keyboardNavigationEnterPressed(event: KeyboardEvent, isEmpty: boolean) {
    if (event.shiftKey) {
      this.triggerNewFacetSearch(this.buildParamsForNormalSearch());
    } else {
      if (this.searchResults.style.display != 'none') {
        this.performSelectActionOnCurrentSearchResult();
        this.completelyDismissSearch();
      } else if ($$(this.search).is('.coveo-facet-search-no-results') && !isEmpty) {
        this.selectAllValuesMatchingSearch();
      }
    }
  }

  private keyboardNavigationDeletePressed(event: KeyboardEvent) {
    if (event.shiftKey) {
      this.performExcludeActionOnCurrentSearchResult();
      this.completelyDismissSearch();
      this.input.value = '';
    }
  }

  private startNewSearchTimeout(params: FacetSearchParameters) {
    this.cancelAnyPendingSearchOperation();
    this.facetSearchTimeout = setTimeout(() => {
      let valueInInput = this.getValueInInputForFacetSearch();
      if (valueInInput == '') {
        if (params.searchEvenIfEmpty) {
          this.triggerNewFacetSearch(params);
        } else {
          this.completelyDismissSearch();
        }
      } else {
        this.triggerNewFacetSearch(params);
      }
    }, this.facet.options.facetSearchDelay);
  }

  private cancelAnyPendingSearchOperation() {
    if (Utils.exists(this.facetSearchTimeout)) {
      clearTimeout(this.facetSearchTimeout);
      this.facetSearchTimeout = undefined;
    }
    if (Utils.exists(this.facetSearchPromise)) {
      Promise.reject(this.facetSearchPromise).catch(() => { });
      this.facetSearchPromise = undefined;
    }

    this.hideFacetSearchWaitingAnimation();
  }

  private processNewFacetSearchResults(fieldValues: IIndexFieldValue[], facetSearchParameters: FacetSearchParameters) {
    Assert.exists(fieldValues);
    fieldValues = new FacetValuesOrder(this.facet, this.facet.facetSort).reorderValues(fieldValues);
    if (fieldValues.length > 0) {
      $$(this.search).removeClass('coveo-facet-search-no-results');
      this.facet.fadeInactiveValuesInMainList(this.facet.options.facetSearchDelay);
      this.rebuildSearchResults(fieldValues, facetSearchParameters);
      if (!facetSearchParameters.fetchMore) {
        this.showSearchResultsElement();
      }
      this.highlightCurrentQueryWithinSearchResults();
      FacetUtils.clipCaptionsToAvoidOverflowingTheirContainer(this.facet, true);
      this.makeFirstSearchResultTheCurrentOne();
    } else {
      if (facetSearchParameters.fetchMore) {
        this.moreValuesToFetch = false;
      } else {
        this.hideSearchResultsElement();
        $$(this.search).addClass('coveo-facet-search-no-results');
      }
    }
  }

  private rebuildSearchResults(fieldValues: IIndexFieldValue[], facetSearchParameters: FacetSearchParameters) {
    Assert.exists(fieldValues);
    if (!facetSearchParameters.fetchMore) {
      $$(this.searchResults).empty();
    }
    let selectAll = document.createElement('li');
    if (Utils.isNonEmptyString(facetSearchParameters.valueToSearch)) {
      $$(selectAll).addClass(['coveo-facet-selectable', 'coveo-facet-search-selectable', 'coveo-facet-search-select-all']);
      $$(selectAll).text('SelectAll');
      $$(selectAll).on('click', () => this.selectAllValuesMatchingSearch());
      if (!this.isMobileDevice()) {
        this.searchResults.appendChild(selectAll);
      }
    }
    let facetValues = _.map(fieldValues, (fieldValue) => {
      return FacetValue.create(fieldValue);
    });
    _.each(new this.facetSearchValuesListKlass(this.facet, FacetValueElement).build(facetValues), (listElement: HTMLElement) => {
      this.searchResults.appendChild(listElement);
    });
    if (this.currentlyDisplayedResults) {
      this.currentlyDisplayedResults = this.currentlyDisplayedResults.concat(_.pluck(facetValues, 'value'));
    } else {
      this.currentlyDisplayedResults = _.pluck(facetValues, 'value');
    }

    if (this.isMobileDevice()) {
      let selectAllMobile = document.createElement('span');
      $$(selectAllMobile).addClass('coveo-mobile-facet-search-select-all');
      selectAll.appendChild(selectAllMobile);
      this.searchResults.appendChild(selectAll);
    }
    _.each($$(this.searchResults).findAll('.coveo-facet-selectable'), (elem: HTMLElement) => {
      $$(elem).addClass('coveo-facet-search-selectable');
      this.setupFacetSearchResultsEvents(elem);
    });

    if (this.facet.searchInterface.isNewDesign()) {
      $$(this.searchResults).on('scroll', () => this.handleFacetSearchResultsScroll());
    }
  }

  private setupFacetSearchResultsEvents(elem: HTMLElement) {
    $$(elem).on('mousemove', () => {
      this.makeCurrentResult(elem);
    });

    // Prevent closing the search results on the end of a touch drag
    let touchDragging = false;
    let mouseDragging = false;
    $$(elem).on('mousedown', () => mouseDragging = false);
    $$(elem).on('mousemove', () => mouseDragging = true);
    $$(elem).on('touchmove', () => touchDragging = true);

    $$(elem).on('mouseup touchend', () => {
      if (!touchDragging && !mouseDragging) {
        setTimeout(() => {
          this.completelyDismissSearch();
        }, 0); // setTimeout is to give time to trigger the click event before hiding the search menu.
      }
      touchDragging = false;
      mouseDragging = false;
    });
  }

  private handleFacetSearchResultsScroll() {
    if (this.facetSearchPromise || this.getValueInInputForFacetSearch() != '' || !this.moreValuesToFetch) {
      return;
    }

    let elementHeight = this.searchResults.clientHeight;
    let scrollHeight = this.searchResults.scrollHeight;
    let bottomPosition = this.searchResults.scrollTop + elementHeight;
    if ((scrollHeight - bottomPosition) < elementHeight / 2) {
      this.triggerNewFacetSearch(this.buildParamsForFetchingMore());
    }
  }

  private buildParamsForNormalSearch() {
    let params = new FacetSearchParameters(this.facet);
    params.setValueToSearch(this.getValueInInputForFacetSearch());
    params.fetchMore = false;
    return params;
  }

  private buildParamsForFetchingMore() {
    let params = this.buildParamsForExcludingCurrentlyDisplayedValues();
    params.fetchMore = true;
    return params;
  }

  protected buildParamsForExcludingCurrentlyDisplayedValues() {
    let params = new FacetSearchParameters(this.facet);
    params.excludeCurrentlyDisplayedValuesInSearch(this.searchResults);
    params.setValueToSearch(this.getValueInInputForFacetSearch());
    return params;
  }

  private showSearchResultsElement() {
    this.positionSearchResults();
  }

  private hideSearchResultsElement() {
    this.searchResults.style.display = 'none';
  }

  private highlightCurrentQueryWithinSearchResults() {
    let captions = $$(this.searchResults).findAll('.coveo-facet-value-caption');
    _.each(captions, (captionElement: HTMLElement) => {
      let search = this.getValueInInputForFacetSearch();
      let regex = new RegExp('(' + StringUtils.wildcardsToRegex(search, this.facet.options.facetSearchIgnoreAccents) + ')', 'ig');

      let text = $$(captionElement).text();
      let highlighted = text.replace(regex, '<span class="coveo-highlight">$1</span>');
      captionElement.innerHTML = highlighted;
    });
  }

  private makeFirstSearchResultTheCurrentOne() {
    this.makeCurrentResult(this.getSelectables()[0]);
  }

  private makeCurrentResult(result: HTMLElement) {
    _.each(this.getSelectables(), (selectable: HTMLElement) => {
      $$(selectable).removeClass('coveo-current');
    });
    $$(result).addClass('coveo-current');
  }

  private moveCurrentResultDown() {
    let current = $$(this.searchResults).find('.coveo-current');
    _.each(this.getSelectables(), (selectable: HTMLElement) => {
      $$(selectable).removeClass('coveo-current');
    });
    let allSelectables = this.getSelectables();
    let idx = _.indexOf(allSelectables, current);
    if (idx < allSelectables.length - 1) {
      $$(allSelectables[idx + 1]).addClass('coveo-current');
    } else {
      $$(allSelectables[0]).addClass('coveo-current');
    }
  }

  private moveCurrentResultUp() {
    let current = $$(this.searchResults).find('.coveo-current');
    _.each($$(this.searchResults).findAll('.coveo-facet-selectable'), (s) => {
      $$(s).removeClass('coveo-current');
    });

    let allSelectables = this.getSelectables();
    let idx = _.indexOf(allSelectables, current);
    if (idx > 0) {
      $$(allSelectables[idx - 1]).addClass('coveo-current');
    } else {
      $$(allSelectables[allSelectables.length - 1]).addClass('coveo-current');
    }
  }

  private getSelectables(target = this.searchResults) {
    return $$(target).findAll('.coveo-facet-selectable');
  }

  private performSelectActionOnCurrentSearchResult() {
    let current = $$(this.searchResults).find('.coveo-current');
    Assert.check(current != undefined);

    let checkbox = <HTMLInputElement>$$(current).find('input[type="checkbox"]');
    if (checkbox != undefined) {
      checkbox.checked = true;
      $$(checkbox).trigger('change');
    } else {
      current.click();
    }
  }

  private performExcludeActionOnCurrentSearchResult() {
    let current = $(this.searchResults).find('.coveo-current');
    Assert.check(current.length == 1);
    current.find('.coveo-facet-value-exclude').click();
  }

  protected getValueInInputForFacetSearch() {
    return this.input.value;
  }

  protected selectAllValuesMatchingSearch() {
    this.facet.showWaitingAnimation();

    let searchParameters = new FacetSearchParameters(this.facet);
    searchParameters.nbResults = 1000;
    searchParameters.setValueToSearch(this.getValueInInputForFacetSearch());
    this.facet.facetQueryController.search(searchParameters).then((fieldValues: IIndexFieldValue[]) => {
      this.completelyDismissSearch();
      ModalBox.close(true);
      let facetValues = _.map(fieldValues, (fieldValue) => {
        let facetValue = this.facet.values.get(fieldValue.value);
        if (!Utils.exists(facetValue)) {
          facetValue = FacetValue.create(fieldValue);
        }
        facetValue.selected = true;
        facetValue.excluded = false;
        return facetValue;
      });
      this.facet.processFacetSearchAllResultsSelected(facetValues);
    });
    this.completelyDismissSearch();
  }

  private showFacetSearchWaitingAnimation() {
    $$(this.magnifier).hide();
    $$(this.wait).show();
    this.showingFacetSearchWaitAnimation = true;
  }

  private hideFacetSearchWaitingAnimation() {
    $$(this.magnifier).show();
    $$(this.wait).hide();
    this.showingFacetSearchWaitAnimation = false;
  }

  private detectSearchBarAnimation() {
    EventsUtils.addPrefixedEvent(this.search, 'AnimationStart', (event) => {
      if (event.animationName == 'grow') {
        this.searchBarIsAnimating = true;
      }
    });

    EventsUtils.addPrefixedEvent(this.search, 'AnimationEnd', (event) => {
      if (event.animationName == 'grow') {
        this.searchBarIsAnimating = false;
      }
    });
  }
}
