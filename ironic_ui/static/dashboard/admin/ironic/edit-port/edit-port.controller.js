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

  var UNABLE_TO_UPDATE_CONNECTIVITY_ATTR_MSG = gettext("This field is disabled because a port cannot have any connectivity attributes (pxe_enabled, local_link_connection, portgroup_id) updated unless its associated node is in an enroll, inspecting, mangeable state; or in maintenance mode."); // eslint-disable-line max-len

  /**
   * Controller used to edit a specified node port
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('EditPortController', EditPortController);

  EditPortController.$inject = [
    '$rootScope',
    '$controller',
    '$uibModalInstance',
    'horizon.framework.widgets.toast.service',
    '$log',
    '$q',
    'horizon.app.core.openstack-service-api.ironic',
    'horizon.dashboard.admin.ironic.events',
    'horizon.dashboard.admin.ironic.update-patch.service',
    'port',
    'node'
  ];

  function EditPortController($rootScope,
                              $controller,
                              $uibModalInstance,
                              toastService,
                              $log,
                              $q,
                              ironic,
                              ironicEvents,
                              updatePatchService,
                              port,
                              node) {
    var ctrl = this;
    $controller('BasePortController',
                {ctrl: ctrl,
                 node: node,
                 $uibModalInstance: $uibModalInstance});

    ctrl.modalTitle = gettext("Edit Port");
    ctrl.submitButtonTitle = gettext("Update Port");

    var cannotEditConnectivityAttr =
        !(node.maintenance || (node.provision_state === "enroll" ||
                               node.provision_state === "inspecting" ||
                               node.provision_state === "manageable"));

    // Initialize form fields
    ctrl.address.value = port.address;
    if ((node.provision_state === "active" || node.instance_uuid) &&
        !node.maintenance) {
      ctrl.address.disable();
    }

    ctrl.pxeEnabled.value = port.pxe_enabled;

    ctrl.portgroup_uuid.value = port.portgroup_uuid;

    if (cannotEditConnectivityAttr) {
      angular.forEach(
        [ctrl.pxeEnabled, ctrl.portgroup_uuid],
        function(field) {
          field.disable(UNABLE_TO_UPDATE_CONNECTIVITY_ATTR_MSG);
        });
    }

    ctrl.localLinkConnection.setValues(
      port.local_link_connection);

    if (cannotEditConnectivityAttr) {
      ctrl.localLinkConnection.disable(
        UNABLE_TO_UPDATE_CONNECTIVITY_ATTR_MSG);
    }

    ctrl.extra.properties = angular.copy(port.extra);

    /**
     * Apply updates to the port being edited
     *
     * @return {void}
     */
    ctrl.updatePort = function() {
      var patcher = new updatePatchService.UpdatePatch();

      $log.info("Updating port " + JSON.stringify(port));

      patcher.buildPatch(port.address, ctrl.address.value, "/address");
      patcher.buildPatch(port.pxe_enabled,
                         ctrl.pxeEnabled.value,
                         "/pxe_enabled");
      var attr = ctrl.localLinkConnection.toPortAttr();
      if (attr) {
        patcher.buildPatch(port.local_link_connection,
                           attr,
                           "/local_link_connection");
      }
      patcher.buildPatch(port.extra, ctrl.extra.properties, "/extra");
      patcher.buildPatch(port.portgroup_uuid,
                         ctrl.portgroup_uuid.value,
                         "/portgroup_uuid");

      var patch = patcher.getPatch();
      $log.info("patch = " + JSON.stringify(patch.patch));
      if (patch.status === updatePatchService.UpdatePatch.status.OK) {
        ironic.updatePort(port.uuid, patch.patch).then(function(port) {
          $rootScope.$emit(ironicEvents.EDIT_PORT_SUCCESS);
          $uibModalInstance.close(port);
        });
      } else {
        toastService.add('error',
                         gettext('Unable to create port update patch.'));
      }
    };

    ctrl.submit = function() {
      ctrl.updatePort();
    };
  }
})();
