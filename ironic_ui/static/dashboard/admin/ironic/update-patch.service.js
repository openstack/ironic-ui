/*
 * Copyright 2016 Cray Inc.
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
    .factory('horizon.dashboard.admin.ironic.update-patch.service',
             updatePatchService);

  updatePatchService.$inject = [
    '$log'
  ];

  function updatePatchService($log) {
    var service = {
      UpdatePatch: UpdatePatch
    };

    /*
      The pdatePatch class is used to construct a set of patch
      instructions that transform a base object into a specified target.
    */
    function UpdatePatch() {
      this.patch = [];
      this.status = UpdatePatch.status.OK;
    }

    UpdatePatch.status = {
      OK: 0,
      ERROR: 1,
      UNKNOWN_TYPE: 2
    };

    /**
     * @description Update the status of the patch with a specified code
     *
     * @param {int} status - latest status code
     * @return {void}
     */
    UpdatePatch.prototype._updateStatus = function(status) {
      this.status = Math.max(this.status, status);
    };

    /**
     * @description Check whether an item is a property
     *
     * @param {object} item - item to be tested
     * @return {boolean} True if the item is a number, string, or date
     */
    function isProperty(item) {
      return item === null ||
        angular.isNumber(item) ||
        angular.isString(item) ||
        angular.isDate(item);
    }

    /**
     * @description Check whether an item is a collection
     *
     * @param {object} item - item to be tested
     * @return {boolean} True if the item is an array or object
     */
    function isCollection(item) {
      return angular.isArray(item) || angular.isObject(item);
    }

    /**
     * @description Add instructions to the patch for processing a
     * specified item
     *
     * @param {object} item - item to be added
     * @param {string} path - Path to the item being added
     * @param {string} op - add or remove
     * @return {void}
     */
    UpdatePatch.prototype._processItem = function(item, path, op) {
      $log.info("UpdatePatch._processItem: " + path + " " + op);
      if (isProperty(item)) {
        this.patch.push({op: op, path: path, value: item});
      } else if (isCollection(item)) {
        angular.forEach(item, function(partName, part) {
          this._processItem(part, path + "/" + partName, op);
        });
      } else {
        this._updateStatus(UpdatePatch.status.UNKNOWN_TYPE);
        $log.error("Unable to process (" + op + ") item (" + path + "). " +
                   " " + typeof item + " " + JSON.stringify(item));
      }
    };

    /**
     * @description Add instructions to the patch for adding a specified item
     *
     * @param {object} item - item to be added
     * @param {string} path - Path to the item being removed
     * @return {void}
     */
    UpdatePatch.prototype._addItem = function(item, path) {
      this._processItem(item, path, "add");
    };

    /**
     * @description Add instructions to the patch for removing a specified item
     *
     * @param {object} item - item to be removed
     * @param {string} path - Path to the item being removed
     * @return {void}
     */
    UpdatePatch.prototype._removeItem = function(item, path) {
      this._processItem(item, path, "remove");
    };

    /**
     * @description Determine the set of operations required to
     * transform a source version of an object into a target version,
     * and add them to a patch.
     *
     * @param {object} source - Source object
     * @param {object} target - Target object
     * @param {string} path - Pathname of the patched object
     * @return {void}
     */
    UpdatePatch.prototype.buildPatch = function(source, target, path) {
      $log.info("UpdatePatch._buildPatch: " + path);
      var patcher = this;

      if (isProperty(source) && isProperty(target)) {
        if (source !== target) {
          patcher.patch.push({op: "replace", path: path, value: target});
        }
      } else if (isCollection(source) && isCollection(target)) {
        angular.forEach(source, function(sourceItem, sourceItemName) {
          if (angular.isDefined(target[sourceItemName])) {
            patcher.buildPatch(sourceItem,
                               target[sourceItemName],
                               path + '/' + sourceItemName);
          } else {
            patcher._removeItem(sourceItem, path + '/' + sourceItemName);
          }
        });
        angular.forEach(target, function(targetItem, targetItemName) {
          if (angular.isUndefined(source[targetItemName])) {
            patcher._addItem(targetItem, path + '/' + targetItemName);
          }
        });
      } else if (isProperty(source) && isCollection(target) ||
                 isCollection(source) && isProperty(target)) {
        patcher._removeItem(source, path);
        patcher._addItem(target, path);
      } else {
        patcher._updateStatus(UpdatePatch.status.ERROR);
        $log.error("Unable to patch " + path + " " +
                   "source = " + JSON.stringify(source) + ", " +
                   "target = " + JSON.stringify(target));
      }
    };

    /**
     * @description Get the patch
     *
     * @return {object} An object with two properties:
     * patch: Array of patch instructions compatible with the Ironic
     * node/port update commands
     * status: Code indicating whether patch creation was successful
     *
     */
    UpdatePatch.prototype.getPatch = function() {
      return {patch: angular.copy(this.patch), status: this.status};
    };

    return service;
  }
})();
