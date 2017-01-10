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

  /**
   * Controller used to support operations on an Ironic port
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('BasePortController', BasePortController);

  BasePortController.$inject = [
    '$uibModalInstance',
    'ctrl'
  ];

  function BasePortController($uibModalInstance,
                              ctrl) {
    ctrl.port = {
      address: null,
      extra: {}
    };

    /**
     * Cancel the modal
     *
     * @return {void}
     */
    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    /**
     * Delete a port metadata property
     *
     * @param {string} propertyName - Name of the property
     * @return {void}
     */
    ctrl.deleteExtra = function(propertyName) {
      delete ctrl.port.extra[propertyName];
    };

    /**
     * Check whether the specified port metadata property already exists
     *
     * @param {string} propertyName - Name of the metadata property
     * @return {boolean} True if the property already exists,
     * otherwise false
     */
    ctrl.checkExtraUnique = function(propertyName) {
      return !(propertyName in ctrl.port.extra);
    };
  }
})();
