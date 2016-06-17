import {$$, Dom} from '../../utils/Dom';
import {InitializationEvents} from '../../events/InitializationEvents';
import {Component} from '../Base/Component';
import {Tab} from '../Tab/Tab';
import {Facet} from '../Facet/Facet';
import {ResponsiveFacets} from './ResponsiveFacets';
import _ = require('underscore');

export interface IResponsiveComponentConstructor {
  new (root: Dom, ID: string): IResponsiveComponent;
}

export interface IResponsiveComponent {
  ID: string;
  needSmallMode(): boolean;
  changeToSmallMode(): void;
  changeToLargeMode(): void;
  handleResizeEvent?(): void;
}

export class ResponsiveComponentsManager {

  public static MEDIUM_MOBILE_WIDTH = 640;

  private static componentManagers: Array<ResponsiveComponentsManager> = [];
  private static remainingComponentInitializations: number = 0;

  private coveoRoot: Dom;
  private resizeListener;
  private responsiveComponents: Array<IResponsiveComponent> = [];
  private tabSection: Dom;
  private searchBoxElement: HTMLElement;
  private isTabActivated: boolean = false;
  private isFacetActivated: boolean = false;
  private responsiveFacets: ResponsiveFacets;

  // Register takes a class and will instantiate it after framework initialization has completed.
  public static register(responsiveComponentConstructor: IResponsiveComponentConstructor, root: Dom, ID: string, component) {

    root.on(InitializationEvents.afterInitialization, () => {
      let responsiveComponent = new responsiveComponentConstructor(root, ID);

      let responsiveComponentsManager = _.find(this.componentManagers, (componentManager) => root.el == componentManager.coveoRoot.el);
      if (responsiveComponentsManager) {
        responsiveComponentsManager.register(responsiveComponent, component);
      } else {
        responsiveComponentsManager = new ResponsiveComponentsManager(root);
        this.componentManagers.push(responsiveComponentsManager);
        responsiveComponentsManager.register(responsiveComponent, component);
      }

      this.remainingComponentInitializations--;
      if (this.remainingComponentInitializations == 0) {
        this.resizeAllComponentsManager();
      }
    });
    this.remainingComponentInitializations++;
  }

  private static resizeAllComponentsManager() {
    _.each(this.componentManagers, componentManager => {
      componentManager.resizeListener();
    });
  }

  constructor(root: Dom) {
    this.coveoRoot = root;
    this.searchBoxElement = this.getSearchBoxElement();
    this.resizeListener = () => {
      for (let i = 0; i < this.responsiveComponents.length; i++) {
        if (this.responsiveComponents[i].needSmallMode()) {
          if (!this.coveoRoot.hasClass('coveo-small-search-interface')) {
            this.coveoRoot.addClass('coveo-small-search-interface');
            this.changeToSmallMode();
          }
          this.handleResizeEvent();
          return;
        }
      }

      if (this.coveoRoot.hasClass('coveo-small-search-interface')) {
        this.coveoRoot.removeClass('coveo-small-search-interface');
        this.changeToLargeMode();
      }
      this.handleResizeEvent();
    };
    window.addEventListener('resize', _.debounce(this.resizeListener, 200));
  }

  public register(responsiveComponent: IResponsiveComponent, component) {

    if (this.isFacet(responsiveComponent) && this.isActivated(responsiveComponent)) {
      this.responsiveFacets.registerFacet(component);
    }

    if (!this.isActivated(responsiveComponent)) {
      if (this.isTabs(responsiveComponent)) {
        this.isTabActivated = true;
        if (this.isFacetActivated) {
          this.tabSection = null;
        }
      }

      if (this.isFacet(responsiveComponent)) {
        this.responsiveFacets = <ResponsiveFacets> responsiveComponent;
        this.responsiveFacets.registerFacet(component)
        this.isFacetActivated = true;
        if (!this.isTabActivated) {
          this.tabSection = $$('div', { className: 'coveo-tab-section' });
        }
        // Facets need to be rendered before tabs, so the facet dropdown header is already there when the responsive tabs check for overflow.
        this.responsiveComponents.unshift(responsiveComponent);
      } else {
        this.responsiveComponents.push(responsiveComponent);
      }
    }

  }

  private changeToSmallMode(): void {
    this.tabSection && this.tabSection.insertAfter(this.searchBoxElement);
    _.each(this.responsiveComponents, responsiveComponent => {
      responsiveComponent.changeToSmallMode();
    });
  }

  private changeToLargeMode(): void {
    this.tabSection && this.tabSection.detach();
    _.each(this.responsiveComponents, responsiveComponent => {
      responsiveComponent.changeToLargeMode();
    });
  }

  private handleResizeEvent(): void {
    _.each(this.responsiveComponents, responsiveComponent => {
      responsiveComponent.handleResizeEvent && responsiveComponent.handleResizeEvent();
    });
  }

  private isFacet(component: IResponsiveComponent): boolean {
    return component.ID == Facet.ID;
  }

  private isTabs(component: IResponsiveComponent): boolean {
    return component.ID == Tab.ID;
  }

  private isActivated(responsiveComponent: IResponsiveComponent): boolean {
    return _.find(this.responsiveComponents, current => { return current.ID == responsiveComponent.ID }) != undefined
  }

  private getSearchBoxElement(): HTMLElement {
    let searchBoxElement = this.coveoRoot.find('.coveo-search-section');
    if (searchBoxElement) {
      return <HTMLElement>searchBoxElement;
    } else {
      return <HTMLElement>this.coveoRoot.find('.CoveoSearchbox');
    }
  }
}
