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

  /**
   * Controller used to create a portgroup on a specified node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('CreatePortgroupController', CreatePortgroupController);

  CreatePortgroupController.$inject = [
    '$controller',
    '$uibModalInstance',
    'horizon.app.core.openstack-service-api.ironic',
    'node'
  ];

  function CreatePortgroupController($controller,
                                     $uibModalInstance,
                                     ironic,
                                     node) {
    var ctrl = this;

    $controller('BasePortgroupController',
                {ctrl: ctrl,
                 $uibModalInstance: $uibModalInstance});

    ctrl.modalTitle = gettext("Create Portgroup");
    ctrl.submitButtonTitle = ctrl.modalTitle;

    /**
     * Create the defined portgroup
     *
     * @return {void}
     */
    ctrl.createPortgroup = function() {
      var portgroup = {
        extra: ctrl.extra.properties,
        properties: ctrl.properties.properties
      };

      portgroup.node_uuid = node.uuid;
      angular.forEach(['address', 'name', 'standalone_ports_supported', 'mode'],
                      function(propertyName) {
                        if (ctrl[propertyName].hasValue()) {
                          portgroup[propertyName] = ctrl[propertyName].value;
                        }
                      });
      ironic.createPortgroup(portgroup).then(
        function(createdPortgroup) {
          $uibModalInstance.close(createdPortgroup);
        });
    };

    ctrl.submit = function() {
      ctrl.createPortgroup();
    };
  }
})();
