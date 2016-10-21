/// <reference path="../../typings/main/ambient/jquery/index.d.ts" />

import {registerCustomMatcher} from '../CustomMatchers';
import {Dom} from '../../src/utils/Dom';
import {$$} from '../../src/utils/Dom';
import {Simulate} from '../Simulate';

export function DomTests() {
  describe('Dom', () => {
    var el: HTMLElement;

    beforeEach(function () {
      el = document.createElement('div');
      registerCustomMatcher();
    });

    afterEach(function () {
      el = undefined;
    });

    describe('without jquery', function () {
      beforeEach(function () {
        // we want to test the basic event, not jquery one
        Simulate.removeJQuery();
      });

      afterEach(function () {
        Simulate.removeJQuery();
      });

      it('insert after should work properly', function () {
        var parent = document.createElement('div');
        var sibling = document.createElement('div');
        parent.appendChild(sibling);
        expect(sibling.nextSibling).toBeNull();
        new Dom(el).insertAfter(sibling);
        expect(sibling.nextSibling).toBe(el);
        expect(sibling.previousSibling).toBeNull();

        var anotherSibling = document.createElement('div');
        parent.appendChild(anotherSibling);
        expect(el.nextSibling).toBe(anotherSibling);
        new Dom(el).insertAfter(anotherSibling);
        expect(el.nextSibling).toBeNull();
        expect(el.previousSibling).toBe(anotherSibling);
      });

      it('insert before should work properly', function () {
        var parent = document.createElement('div');
        var sibling = document.createElement('div');
        parent.appendChild(sibling);
        expect(sibling.nextSibling).toBeNull();
        new Dom(el).insertBefore(sibling);
        expect(sibling.nextSibling).toBeNull();
        expect(sibling.previousSibling).toBe(el);

        var anotherSibling = document.createElement('div');
        parent.appendChild(anotherSibling);
        expect(anotherSibling.nextSibling).toBeNull();
        expect(anotherSibling.previousSibling).toBe(sibling);
        new Dom(el).insertBefore(anotherSibling);
        expect(el.nextSibling).toBe(anotherSibling);
        expect(el.previousSibling).toBe(sibling);
      });

      it('replace should work properly', function () {
        var other = document.createElement('div');
        var sibling = document.createElement('div');
        var otherSibling = document.createElement('div');
        var parent = document.createElement('div');
        parent.appendChild(sibling);
        parent.appendChild(el);
        parent.appendChild(otherSibling);

        expect(el.parentNode).toBe(parent);
        expect(other.parentNode).toBeNull();
        expect(el.previousSibling).toBe(sibling);
        expect(el.nextSibling).toBe(otherSibling);
        new Dom(el).replaceWith(other);
        expect(el.parentNode).toBeNull();
        expect(other.parentNode).toBe(parent);
        expect(other.previousSibling).toBe(sibling);
        expect(other.nextSibling).toBe(otherSibling);
      });

      describe('prepend', function () {
        it('should work properly', function () {
          var firstChild = document.createElement('div');
          el.appendChild(firstChild);
          expect(el.firstChild).toBe(firstChild);

          var toPrepend = document.createElement('div');
          new Dom(el).prepend(toPrepend);
          expect(el.firstChild).toBe(toPrepend);
          expect(toPrepend.nextSibling).toBe(firstChild);
        });

        it('should work even if there if parent element is empty', function () {
          var parent = $$('div');
          var toPrepend = $$('span', { className: 'foo' }).el;
          parent.prepend(toPrepend);
          expect(parent.el.firstChild).toBe(toPrepend);
        });

        it('should work even if parent element contains text', function () {
          var parent = $$('div', {}, 'thisissometext');
          var toPrepend = $$('span', { className: 'foo' }).el;
          parent.prepend(toPrepend);
          expect(parent.el.firstChild).toBe(toPrepend);
        });
      });

      it('should give the correct text content', function () {
        el.innerHTML = '<div>this is the content</div>';
        expect(new Dom(el).text()).toEqual('this is the content');
        el = document.createElement('div');
        el.innerHTML = '<div>this <span>is</span> the <div><span>content</span></div></div>';
        expect(new Dom(el).text()).toEqual('this is the content');
      });

      it('should allow to set the text content', function () {
        var dom = new Dom(el).text('this is the content');
        expect(el.innerHTML).toEqual('this is the content');

        /// Setting HTML content as text should still work
        el = document.createElement('div');
        dom = new Dom(el).text('<div>this is the content</div>');
        expect(el.childNodes[0].nodeValue).toEqual('<div>this is the content</div>');
      });

      describe('createElement', function () {
        it('should properly create a single HTMLElement', function () {
          var elem = Dom.createElement('div', {
            id: 'heidi',
            className: 'kloss',
            'data-my-attr': 'baz'
          }, 'foobar2000');
          expect(elem.tagName).toEqual('DIV');
          expect(elem.id).toEqual('heidi');
          expect(elem.className).toEqual('kloss');
          expect(elem.dataset['myAttr']).toEqual('baz');
          expect(elem.innerHTML).toEqual('foobar2000');
        });

        it('should properly create nested HTMLElement\'s', function () {
          var elem = Dom.createElement('header', undefined,
            Dom.createElement('div', undefined,
              Dom.createElement('span', undefined, 'foo')));
          expect(elem.tagName).toEqual('HEADER');
          expect(elem.firstChild.nodeName).toEqual('DIV');
          expect(elem.firstChild.firstChild.nodeName).toEqual('SPAN');
          expect(elem.firstChild.firstChild['innerHTML']).toEqual('foo');
        });
      });

      it('should find a child using a query selector', function () {
        var toFind = document.createElement('div');
        toFind.className = 'qwerty';
        el.appendChild(toFind);
        expect(new Dom(el).find('.qwerty')).toBe(toFind);

        el = document.createElement('div');
        toFind = document.createElement('div');
        toFind.className = 'qwerty notqwerty';
        el.appendChild(toFind);
        expect(new Dom(el).find('.qwerty')).toBe(toFind);

        el = document.createElement('div');
        toFind = document.createElement('div');
        toFind.id = 'qwerty';
        el.appendChild(toFind);
        expect(new Dom(el).find('#qwerty')).toBe(toFind);

        el = document.createElement('div');
        var inner = document.createElement('div');
        toFind = document.createElement('div');
        toFind.id = 'qwerty';
        inner.appendChild(toFind);
        el.appendChild(inner);
        expect(new Dom(el).find('#qwerty')).toBe(toFind);
      });

      it('should find all child using a query selector', function () {
        var toFind = document.createElement('div');
        toFind.className = 'qwerty';
        var toFind2 = document.createElement('div');
        toFind2.className = 'qwerty notqwerty';
        el.appendChild(toFind);
        el.appendChild(toFind2);
        expect(new Dom(el).findAll('.qwerty')).toContain(toFind);
        expect(new Dom(el).findAll('.qwerty')).toContain(toFind2);
      });

      it('using findClass should find the child element', function () {
        var toFind = document.createElement('div');
        toFind.className = 'qwerty';
        var toFind2 = document.createElement('div');
        toFind2.className = 'qwerty notqwerty';
        toFind2.id = 'shouldNotBeFound';
        el.appendChild(toFind);
        el.appendChild(toFind2);
        expect(new Dom(el).findClass('qwerty')).toContain(toFind);
        expect(new Dom(el).findClass('qwerty')).toContain(toFind2);
        expect(new Dom(el).findClass('shouldNotBeFound').length).toBe(0);
      });

      it('using addClass should work properly', function () {
        el.className = 'qwerty';
        new Dom(el).addClass('notqwerty');
        expect(el.className).toBe('qwerty notqwerty');

        el = document.createElement('div');
        el.className = 'qwerty';
        new Dom(el).addClass('qwerty');
        expect(el.className).toBe('qwerty');

        el = document.createElement('div');
        new Dom(el).addClass('qwerty');
        expect(el.className).toBe('qwerty');

        el = document.createElement('div');
        new Dom(el).addClass(['a', 'b', 'c']);
        expect(el.className).toBe('a b c');
      });

      it('using removeClass should work properly', function () {
        el.className = 'qwerty';
        new Dom(el).removeClass('qwerty');
        expect(el.className).toBe('');

        el = document.createElement('div');
        el.className = 'qwerty notqwerty';
        new Dom(el).removeClass('qwerty');
        expect(el.className).toBe('notqwerty');

        el = document.createElement('div');
        el.className = 'qwerty notqwerty';
        new Dom(el).removeClass('notqwerty');
        expect(el.className).toBe('qwerty');

        el = document.createElement('div');
        new Dom(el).removeClass('qwerty');
        expect(el.className).toBe('');

        el = document.createElement('div');
        el.className = 'popoqwerty qwerty notqwerty';
        new Dom(el).removeClass('qwerty');
        expect(el.className).toBe('popoqwerty notqwerty');
      });

      it('using getClass should return the correct array with all classes', function () {
        el.className = 'qwerty';
        expect(new Dom(el).getClass()).toContain('qwerty');

        el = document.createElement('div');
        el.className = 'qwerty notqwerty';
        expect(new Dom(el).getClass()).toContain('qwerty');
        expect(new Dom(el).getClass()).toContain('notqwerty');
      });

      it('using hasClass should return properly', function () {
        el.className = 'qwerty';
        expect(new Dom(el).hasClass('qwerty')).toBe(true);

        el = document.createElement('div');
        el.className = 'qwerty notqwerty qwerty';
        expect(new Dom(el).hasClass('qwerty')).toBe(true);

        el = document.createElement('div');
        el.className = 'qwerty notqwerty qwerty';
        expect(new Dom(el).hasClass(' ')).toBe(false);

        el = document.createElement('div');
        el.className = 'qwerty notqwerty qwerty';
        expect(new Dom(el).hasClass('')).toBe(false);

        el = document.createElement('div');
        el.className = 'qwerty';
        expect(new Dom(el).hasClass('notqwerty')).toBe(false);

        el = document.createElement('div');
        expect(new Dom(el).hasClass('')).toBe(false);

        el = document.createElement('div');
        expect(new Dom(el).hasClass('qwerty')).toBe(false);
      });

      it('using toggleClass without switch should work properly', function () {
        el.className = 'qwerty';
        var domEl = new Dom(el);
        domEl.toggleClass('qwerty');
        expect(domEl.hasClass('qwerty')).toBe(false);

        el = document.createElement('div');
        domEl = new Dom(el);
        domEl.toggleClass('foobar2000');
        expect(domEl.hasClass('foobar2000')).toBe(true);
      });

      it('using toggleClass with switch should work properly', function () {
        var domEl = new Dom(el);
        domEl.toggleClass('qwerty', false);
        expect(domEl.hasClass('qwerty')).toBe(false);

        domEl = new Dom(document.createElement('div'));
        domEl.addClass('foobar2000');
        domEl.toggleClass('foobar2000', true);
        expect(domEl.hasClass('foobar2000')).toBe(true);

      });

      it('using detach should work properly', function () {
        var parent = document.createElement('div');
        parent.appendChild(el);
        expect(parent.children).toContain(el);

        new Dom(el).detach();
        expect(parent.children).not.toContain(el);
      });

      it('using on should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).on('click', spy);
        el.click();
        expect(spy).toHaveBeenCalled();

        var spy2 = jasmine.createSpy('spy2');
        new Dom(el).on('foo', spy2);
        var event = new CustomEvent('foo', {
          detail: {
            lorem: 'ipsum'
          }
        });

        el.dispatchEvent(event);
        expect(spy2).toHaveBeenCalledWith(event, event.detail);


        var spy3 = jasmine.createSpy('spy3');
        new Dom(el).on(['1', '2', '3'], spy3);
        var events = ['1', '2', '3'].map((evt) => {
          return new CustomEvent(evt);
        });
        events.forEach((evt) => {
          el.dispatchEvent(evt);
        });
        expect(spy3).toHaveBeenCalledTimes(3);
      });

      it('using one should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).one('click', spy);
        el.click();
        el.click();
        el.click();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).not.toHaveBeenCalledTimes(3);
      });

      it('using off should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).on('click', spy);
        new Dom(el).off('click', spy);
        el.click();
        expect(spy).not.toHaveBeenCalled();

        var spy2 = jasmine.createSpy('spy2');
        new Dom(el).on(['1', '2', '3'], spy2);
        var events = ['1', '2', '3'].map((evt) => {
          return new CustomEvent(evt);
        });
        new Dom(el).off(['1', '2', '3'], spy2);
        events.forEach((evt) => {
          el.dispatchEvent(evt);
        });
        expect(spy).not.toHaveBeenCalled();
      });

      it('using trigger should work properly', function () {
        registerCustomMatcher();
        var spy = jasmine.createSpy('spy');
        new Dom(el).on('click', spy);
        new Dom(el).trigger('click');
        expect(spy).toHaveBeenCalled();

        var spy2 = jasmine.createSpy('spy2');
        new Dom(el).on('foo', spy2);
        new Dom(el).trigger('foo', { bar: 'baz' });
        expect(spy2).eventHandlerToHaveBeenCalledWith({ bar: 'baz' });
      });

      it('using isEmpty should work properly', function () {
        expect(new Dom(el).isEmpty()).toBe(true);
        el.appendChild(document.createElement('div'));
        expect(new Dom(el).isEmpty()).toBe(false);

        el = document.createElement('div');
        el.innerHTML = '        ';
        expect(new Dom(el).isEmpty()).toBe(true);
      });

      it('should find ancestor element using closest', function () {
        var root = document.createElement('div');
        root.className = 'findme';
        root.appendChild(el);
        expect(new Dom(el).closest('findme')).toBe(root);
      });

      it('should find the first ancestor element using parent', function () {
        let root = document.createElement('div');
        let parentOne = $$('div', { className: 'foo' });
        let parentTwo = $$('div', { className: 'foo' });
        let parentThree = $$('div', { className: 'foo' });

        let child = $$('div');

        root.appendChild(parentOne.el);
        parentOne.append(parentTwo.el);
        parentTwo.append(parentThree.el);
        parentThree.append(child.el);

        expect(child.parent('foo')).toEqual(parentThree.el);
      });

      it('should not throw if there are no parent element using parent', function () {
        let root = $$('div');
        expect(() => root.parent('bar')).not.toThrow();
      });

      it('should return undefined if there is no match using parent', function () {
        let root = document.createElement('div');
        let parentOne = $$('div', { className: 'foo' });
        let parentTwo = $$('div', { className: 'foo' });
        let parentThree = $$('div', { className: 'foo' });

        let child = $$('div');

        root.appendChild(parentOne.el);
        parentOne.append(parentTwo.el);
        parentTwo.append(parentThree.el);
        parentThree.append(child.el);

        expect(child.parent('bar')).toBeUndefined();
      });

      it('should find all ancestor elements using parents', function () {
        let root = document.createElement('div');
        let parentOne = $$('div', { className: 'foo' });
        let parentTwo = $$('div', { className: 'foo' });
        let parentThree = $$('div', { className: 'foo' });

        let child = $$('div');

        root.appendChild(parentOne.el);
        parentOne.append(parentTwo.el);
        parentTwo.append(parentThree.el);
        parentThree.append(child.el);

        expect(child.parents('foo')).toEqual([parentThree.el, parentTwo.el, parentOne.el]);
      });

      it('should return empty array if there is no match using parents', function () {
        let root = document.createElement('div');
        let parentOne = $$('div', { className: 'foo' });
        let parentTwo = $$('div', { className: 'foo' });
        let parentThree = $$('div', { className: 'foo' });

        let child = $$('div');

        root.appendChild(parentOne.el);
        parentOne.append(parentTwo.el);
        parentTwo.append(parentThree.el);
        parentThree.append(child.el);

        expect(child.parents('bar')).toEqual([]);
      });

      it('should not fail if there is no parent element using parents', function () {
        let root = $$('div');
        expect(() => root.parents('bar')).not.toThrow();
      });

      it('should be able to tell if an element matches a selector', function () {
        el = document.createElement('div');
        el.className = 'foo bar foobar';
        el.setAttribute('id', 'batman');

        expect(new Dom(el).is('div')).toBe(true);
        expect(new Dom(el).is('.foo')).toBe(true);
        expect(new Dom(el).is('.foobar')).toBe(true);
        expect(new Dom(el).is('#batman')).toBe(true);

        // no leading point for class
        expect(new Dom(el).is('foo')).toBe(false);
        // no leading # for id
        expect(new Dom(el).is('batman')).toBe(false);
        // class does not exists
        expect(new Dom(el).is('nope')).toBe(false);
        // not the correct tag
        expect(new Dom(el).is('input')).toBe(false);
      });

      it('should be able to empty an element', function () {
        var append1 = document.createElement('div');
        var append2 = document.createElement('div');
        el.appendChild(append1);
        el.appendChild(append2);
        expect(append1.parentElement).toBe(el);
        expect(append2.parentElement).toBe(el);
        new Dom(el).empty();
        expect(append1.parentElement).toBeNull();
        expect(append2.parentElement).toBeNull();
      });
    });

    describe('with jquery', function () {

      beforeEach(function () {
        // we want to test the basic event, not jquery one
        Simulate.addJQuery();
      });

      afterEach(function () {
        Simulate.removeJQuery();
      });

      it('using on should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).on('click', spy);
        el.click();
        expect(spy).toHaveBeenCalled();

        var spy2 = jasmine.createSpy('spy2');
        new Dom(el).on('foo', spy2);
        new Dom(el).trigger('foo', {
          detail: {
            lorem: 'ipsum'
          }
        });

        expect(spy2).toHaveBeenCalledWith(jasmine.any(jQuery.Event), jasmine.objectContaining({
          detail: {
            lorem: 'ipsum'
          }
        }));


        var spy3 = jasmine.createSpy('spy3');
        new Dom(el).on(['1', '2', '3'], spy3);
        var events = ['1', '2', '3'].map((evt) => {
          return new CustomEvent(evt);
        });
        events.forEach((evt) => {
          el.dispatchEvent(evt);
        });
        expect(spy3).toHaveBeenCalledTimes(3);
      });

      it('using one should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).one('click', spy);
        el.click();
        el.click();
        el.click();
        expect(spy).toHaveBeenCalled();
        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).not.toHaveBeenCalledTimes(3);
      });

      it('using off should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).on('click', spy);
        new Dom(el).off('click', spy);
        el.click();
        expect(spy).not.toHaveBeenCalled();

        var spy2 = jasmine.createSpy('spy2');
        new Dom(el).on(['1', '2', '3'], spy2);
        new Dom(el).off(['1', '2', '3'], spy2);
        ['1', '2', '3'].forEach((evt) => {
          new Dom(el).trigger(evt);
        });
        expect(spy).not.toHaveBeenCalled();
      });

      it('using trigger should work properly', function () {
        var spy = jasmine.createSpy('spy');
        new Dom(el).on('click', spy);
        new Dom(el).trigger('click');
        expect(spy).toHaveBeenCalled();

        var spy2 = jasmine.createSpy('spy2');
        new Dom(el).on('foo', spy2);
        new Dom(el).trigger('foo', { bar: 'baz' });
        expect(spy2).toHaveBeenCalledWith(jasmine.any(jQuery.Event), { bar: 'baz' });
      });
    });
  });
}
