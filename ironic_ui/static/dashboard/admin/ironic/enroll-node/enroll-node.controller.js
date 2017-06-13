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
   * Controller used to enroll a node in the Ironic database
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('EnrollNodeController', EnrollNodeController);

  EnrollNodeController.$inject = [
    '$rootScope',
    '$controller',
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    '$log'
  ];

  function EnrollNodeController($rootScope,
                                $controller,
                                $uibModalInstance,
                                ironic,
                                ironicEvents,
                                $log) {
    var ctrl = this;

    $controller('BaseNodeController',
                {ctrl: ctrl,
                 $uibModalInstance: $uibModalInstance});

    ctrl.modalTitle = gettext("Enroll Node");
    ctrl.submitButtonTitle = ctrl.modalTitle;

    init();

    function init() {
      ctrl._loadDrivers();
      ctrl._getImages();
    }

    ctrl.submit = function() {
      $log.debug(">> EnrollNodeController.submit()");
      angular.forEach(ctrl.driverProperties, function(property, name) {
        $log.debug(name +
                   ", required = " + property.isRequired() +
                   ", active = " + property.isActive() +
                   ", input-value = " + property.getInputValue() +
                   ", default-value = " + property.getDefaultValue());
        if (property.isActive() &&
            property.getInputValue() &&
            property.getInputValue() !== property.getDefaultValue()) {
          $log.debug("Setting driver property " + name + " to " +
                     property.inputValue);
          ctrl.node.driver_info[name] = property.inputValue;
        }
      });

      angular.forEach(ctrl.driverInterfaceFields, function(field, interfaceName) {
        ctrl.node[interfaceName + '_interface'] = field.value;
      });

      ironic.createNode(ctrl.node).then(
        function(response) {
          $log.info("create node response = " + JSON.stringify(response));
          $rootScope.$emit(ironicEvents.ENROLL_NODE_SUCCESS);
          $uibModalInstance.close(response.data);
        });
      $log.debug("<< EnrollNodeController.submit()");
    };
  }
})();
