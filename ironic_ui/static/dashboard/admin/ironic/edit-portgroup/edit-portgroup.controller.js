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
   * Controller used to edit a specified node portgroup
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('EditPortgroupController', EditPortgroupController);

  EditPortgroupController.$inject = [
    '$controller',
    '$uibModalInstance',
    '$log',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.update-patch.service',
    'portgroup'
  ];

  function EditPortgroupController($controller,
                                   $uibModalInstance,
                                   $log,
                                   ironic,
                                   updatePatchService,
                                   portgroup) {
    var ctrl = this;
    $controller('BasePortgroupController',
                {ctrl: ctrl,
                 $uibModalInstance: $uibModalInstance});

    ctrl.modalTitle = gettext("Edit Portgroup");
    ctrl.submitButtonTitle = gettext("Update Portgroup");

    // Initialize form fields
    ctrl.address.value = portgroup.address;

    ctrl.name.value = portgroup.name;

    ctrl.standalone_ports_supported.value =
      portgroup.standalone_ports_supported ? 'True' : 'False';

    ctrl.mode.value = portgroup.mode;

    ctrl.properties.properties = angular.copy(portgroup.properties);

    ctrl.extra.properties = angular.copy(portgroup.extra);

    /**
     * Apply updates to the portgroup being edited
     *
     * @return {void}
     */
    ctrl.updatePortgroup = function() {
      var patcher = new updatePatchService.UpdatePatch();

      $log.info("Updating portgroup " + JSON.stringify(portgroup));

      patcher.buildPatch(portgroup.address, ctrl.address.value, "/address");
      patcher.buildPatch(portgroup.name, ctrl.name.value, "/name");
      patcher.buildPatch(portgroup.standalone_ports_supported
                         ? 'True' : 'False',
                         ctrl.standalone_ports_supported.value,
                         "/standalone_ports_supported");
      patcher.buildPatch(portgroup.mode,
                         ctrl.mode.value,
                         "/mode");
      patcher.buildPatch(portgroup.properties,
                         ctrl.properties.properties,
                         "/properties");
      patcher.buildPatch(portgroup.extra, ctrl.extra.properties, "/extra");

      var patch = patcher.getPatch();
      $log.info("patch = " + JSON.stringify(patch.patch));
      if (patch.status === updatePatchService.UpdatePatch.status.OK) {
        ironic.updatePortgroup(portgroup.uuid, patch.patch)
          .then(function(portgroup) {
            $uibModalInstance.close(portgroup);
          });
      } else {
        toastService.add('error',
                         gettext('Unable to create portgroup update patch.'));
      }
    };

    ctrl.submit = function() {
      ctrl.updatePortgroup();
    };
  }
})();
