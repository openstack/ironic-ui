/*
 * Copyright 2017 Cray Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *    http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
(function() {
  'use strict';

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.property-collection.service',
             propertyCollectionService);

  function propertyCollectionService() {
    var service = {
      PropertyCollection: PropertyCollection
    };

    /**
     * @description Utility class for managing property collections.
     *              Used is association with the property-collection-editor directive.
     *
     * @param {object} args - Base properties are:
     *   id [string]               - Unique id used to create DOM element ids, and
     *                               internal variable names
     *   title [string]            - Label used to identify the collection to the user
     *   addPropertyLabel [string] - Label used to prompt the user to add a new
     *                               property
     *   placeholder [string]      - Placeholder for text input field
     *   properties [object]       - Dictionary of property values indexed by
     *                               property name
     *
     * @return {void}
     */
    function PropertyCollection(args) {
      var collection = this;
      collection.id = undefined;
      collection.title = undefined;
      collection.addPropertyLabel = undefined;
      collection.placeholder = undefined;
      collection.properties = {};

      angular.forEach(args, function(value, arg) {
        collection[arg] = value;
      });

      /**
       * @description Test whether this collection contains a property.
       *
       * @param {string} propertyName - Property name.
       * @return {boolean} True if the property already exists, false otherwise.
       */
      this.checkPropertyUnique = function(propertyName) {
        return !(propertyName in collection.properties);
      };

      /**
       * @description Add a property to the collection.
       *
       * @param {string} propertyName - Property name.
       * @return {void}
       */
      this.addProperty = function(propertyName) {
        this.properties[propertyName] = null;
      };

      /**
       * @description Delete a specified property.
       *
       * @param {string} propertyName - Property name.
       * @return {void}
       */
      this.deleteProperty = function(propertyName) {
        delete collection.properties[propertyName];
      };

      /**
       * @description Test whether this collection is in a complete state.
       *   Complete is defined as all properties having a non-null value.
       *
       * @return {boolean} True if the collection is complete, false otherwise.
       */
      this.complete = function() {
        for (var propertyName in this.properties) {
          if (this.properties.hasOwnProperty(propertyName) &&
              this.properties[propertyName] === null) {
            return false;
          }
        }
        return true;
      };
    }
    return service;
  }
})();
