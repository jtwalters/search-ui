import {Dropdown} from '../Form/Dropdown';
import {FacetUtils} from '../../../ui/Facet/FacetUtils';
import {IIndexFieldValue} from '../../../rest/FieldValue';
import {ISearchEndpoint} from '../../../rest/SearchEndpointInterface';
import {DocumentInput} from './DocumentInput';
import {$$} from '../../../utils/Dom';

export class SimpleFieldInput extends DocumentInput {

  protected element: HTMLElement;
  public dropDown: Dropdown;

  constructor(public inputName: string, public fieldName: string, private endpoint: ISearchEndpoint) {
    super(inputName);
  }

  public reset() {
    this.dropDown.reset();
  }

  public build(): HTMLElement {
    let fieldInput = $$(super.build());
    this.buildFieldSelect().then(() => {
      fieldInput.append(this.dropDown.getElement());
    });
    this.element = fieldInput.el;
    return this.element;
  }

  public getValue(): string {
    let value = this.dropDown ? this.dropDown.getValue() : '';
    return value ? this.fieldName + '==\"' + value + '\"' : '';
  }

  private buildFieldSelect() {
    return this.endpoint.listFieldValues({ field: this.fieldName }).then((values: IIndexFieldValue[]) => {
      let options = [''];
      _.each(values, (value: IIndexFieldValue) => {
        options.push(value.value);
      });
      this.dropDown = new Dropdown(this.onChange.bind(this), options, (str: string) => {
        return FacetUtils.tryToGetTranslatedCaption(this.fieldName, str);
      });
    });
  }

}
