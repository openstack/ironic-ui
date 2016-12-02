/*
 * © Copyright 2016 Cray Inc.
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

(function () {
  'use strict';

  angular
    .module('horizon.dashboard.admin.ironic')
    .service('horizon.dashboard.admin.ironic.node-error.service',
             nodeErrorService);

  nodeErrorService.$inject = [
    'horizon.framework.widgets.toast.service'
  ];

  function nodeErrorService(toastService) {
    // Node last_error cache indexed by node uuid
    var lastError = sessionStorage.nodeErrorService
      ? angular.fromJson(sessionStorage.nodeErrorService) : {};

    /**
     * @description Get the error condition for a specified node
     *
     * @param {string} nodeUuid – node uuid
     * @return {string} Error condition
     */
    this.getLastError = function(nodeUuid) {
      return angular.isDefined(lastError[nodeUuid])
        ? lastError[nodeUuid] : null;
    };

    /**
     * @description Store the error condition for a specified node
     *
     * @param {node} node – node
     * @return {void}
     */
    function setLastError(node) {
      lastError[node.uuid] = node.last_error;
      // Store node error condition in browser session storage
      // which provides persistence across page transitions.
      sessionStorage.nodeErrorService = angular.toJson(lastError);
    }

    /**
     * @description Notify the user of a change in error condition for
     * specified node.
     *
     * @param {node} node – node being checked
     * @return {void}
     */
    this.checkNodeError = function(node) {
      if (node.last_error !== null &&
          node.last_error !== "" &&
          (!angular.isDefined(lastError[node.uuid]) ||
           node.last_error !== lastError[node.uuid])) {
        toastService.add(
          'error',
          "Detected change in error condition on node " +
            node.name + ". " +
            node.last_error);
      }
      // Update stored node error condition
      setLastError(node);
    };
  }
})();
