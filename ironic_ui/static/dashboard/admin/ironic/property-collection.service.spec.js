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
    'horizon.dashboard.admin.ironic.property-collection.service',

    function() {
      var propertyCollectionService;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(inject(function($injector) {
        propertyCollectionService =
          $injector.get('horizon.dashboard.admin.ironic.property-collection.service');
      }));

      it('defines the form-field service', function() {
        expect(propertyCollectionService).toBeDefined();
      });

      it('PropertyCollection - default construction', function() {
        var collection = new propertyCollectionService.PropertyCollection({});

        expect(collection.id).toBeUndefined();
        expect(collection.title).toBeUndefined();
        expect(collection.addPropertyLabel).toBeUndefined();
        expect(collection.placeholder).toBeUndefined();
        expect(collection.properties).toEqual({});
        expect(collection.checkPropertyUnique).toBeDefined();
        expect(collection.addProperty).toBeDefined();
        expect(collection.deleteProperty).toBeDefined();
        expect(collection.complete).toBeDefined();
      });

      it('PropertyCollection - local parameters', function() {
        var args = {id: 'id',
                    title: 'title',
                    placeholder: 'placeholder',
                    properties: {'prop-1': 'prop1-val',
                                 'prop-2': 'prop2-val'}
                   };
        var collection = new propertyCollectionService.PropertyCollection(args);
        for (var arg in args) {
          if (args.hasOwnProperty(arg)) {
            expect(collection[arg]).toBeDefined();
            expect(collection[arg]).toEqual(args[arg]);
          }
        }
      });

      it('checkPropertyUnique', function() {
        var collection = new propertyCollectionService.PropertyCollection({});
        expect(collection.checkPropertyUnique('foo')).toBe(true);
        collection.addProperty('foo');
        expect(collection.checkPropertyUnique('foo')).toBe(false);
      });

      it('addProperty', function() {
        var collection = new propertyCollectionService.PropertyCollection({});
        collection.addProperty('foo');
        expect(collection.properties.foo).toBeDefined();
        expect(collection.properties.foo).toBe(null);
      });

      it('deleteProperty', function() {
        var collection = new propertyCollectionService.PropertyCollection({});
        var original = angular.copy(collection);
        collection.addProperty('foo');
        collection.deleteProperty('foo');
        expect(collection).toEqual(original);
      });

      it('complete', function() {
        var collection = new propertyCollectionService.PropertyCollection({});
        expect(collection.complete()).toBe(true);
        collection.addProperty('foo');
        expect(collection.complete()).toBe(false);
      });
    });
})();
