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

  describe(
    'horizon.dashboard.admin.ironic.driver-property.service',
    function() {
      var service;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(inject(function($injector) {
        service =
          $injector.get('horizon.dashboard.admin.ironic.driver-property.service');
      }));

      it('defines the service', function() {
        expect(service).toBeDefined();
      });

      describe('DriverProperty', function() {
        it('Base construction', function() {
          var propertyName = 'propertyName';
          var description = '';
          var propertySet = [];
          var property = new service.DriverProperty(propertyName,
                                                    description,
                                                    propertySet);
          expect(property.name).toBe(propertyName);
          expect(property.desc).toBe(description);
          expect(property.propertySet).toBe(propertySet);
          expect(property.getSelectOptions()).toBe(null);
          expect(property.required).toBe(false);
          expect(property.defaultValue).toBe(undefined);
          expect(property.inputValue).toBe(undefined);
          expect(property.getInputValue()).toBe(undefined);
          expect(property.isActive()).toBe(true);
        });

        it('Required - ends with', function() {
          var property = new service.DriverProperty('propertyName',
                                                    ' Required.',
                                                    []);
          expect(property.required).toBe(true);
        });

        it('Not required - missing space', function() {
          var property = new service.DriverProperty('propertyName',
                                                    'Required.',
                                                    []);
          expect(property.required).toBe(false);
        });

        it('Not required - missing period', function() {
          var property = new service.DriverProperty('propertyName',
                                                    ' Required',
                                                    []);
          expect(property.required).toBe(false);
        });

        it('Select options', function() {
          var property = new service.DriverProperty(
            'propertyName',
            'One of "foo", bar.',
            []);
          expect(property.getSelectOptions()).toEqual(['foo', 'bar']);
        });

        it('Select options - No single quotes', function() {
          var property = new service.DriverProperty(
            'propertyName',
            "One of 'foo', bar.",
            []);
          expect(property.getSelectOptions()).toEqual(["'foo'", 'bar']);
        });

        it('default - is string', function() {
          var property = new service.DriverProperty(
            'propertyName',
            'default is "5.1".',
            []);
          expect(property._getDefaultValue()).toEqual('5.1');
        });

        it('default - period processing', function() {
          var property = new service.DriverProperty(
            'propertyName',
            'default is 5.1.',
            []);
          expect(property._getDefaultValue()).toEqual('5');
        });
      });
    });
})();
