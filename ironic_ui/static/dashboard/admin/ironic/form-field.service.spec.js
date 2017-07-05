/**
 * Copyright 2017 Cray Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  "use strict";

  /**
   * @description Unit tests for the form-field service
   */

  describe(
    'horizon.dashboard.admin.ironic.form-field.service',

    function() {
      var formFieldService;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(inject(function($injector) {
        formFieldService =
          $injector.get('horizon.dashboard.admin.ironic.form-field.service');
      }));

      it('defines the form-field service', function() {
        expect(formFieldService).toBeDefined();
      });

      it('FormField - default construction', function() {
        var field = new formFieldService.FormField({});

        expect(field.type).toEqual('input');
        expect(field.id).toBeUndefined();
        expect(field.title).toBeUndefined();
        expect(field.options).toBeUndefined();
        expect(field.value).toBeUndefined();
        expect(field.required).toBe(false);
        expect(field.desc).toBeUndefined();
        expect(field.pattern).toBeUndefined();
        expect(field.disabled).toBe(false);
        expect(field.info).toBeUndefined();
        expect(field.autoFocus).toBe(false);
        expect(field.change).toBeUndefined();
        expect(field.hasValue).toBeDefined();
        expect(field.disable).toBeDefined();
      });

      it('FormField - local parameters', function() {
        var title = "title";
        var field = new formFieldService.FormField({
          title: title
        });

        expect(field.title).toBe(title);
      });

      it('hasValue', function() {
        var field = new formFieldService.FormField({});
        expect(field.hasValue()).toBe(false);

        field.value = '';
        expect(field.hasValue()).toBe(false);

        field.value = null;
        expect(field.hasValue()).toBe(true);

        field.value = 'True';
        expect(field.hasValue()).toBe(true);
      });

      it('disable', function() {
        var field = new formFieldService.FormField({});
        expect(field.disabled).toBe(false);
        field.disable();
        expect(field.disabled).toBe(true);
      });
    });
})();
