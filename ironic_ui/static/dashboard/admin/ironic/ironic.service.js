/*
 * © Copyright 2015,2016 Hewlett Packard Enterprise Development Company LP
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
    .module('horizon.app.core.openstack-service-api')
    .factory('horizon.app.core.openstack-service-api.ironic', ironicAPI);

  ironicAPI.$inject = [
    'horizon.framework.util.http.service',
    'horizon.framework.widgets.toast.service'
  ];

  /**
   * @ngdoc service
   * @name horizon.app.core.openstack-service-api.ironic
   * @description Provides access to Ironic API
   */

  function ironicAPI(apiService, toastService) {
    var service = {
      getNodes: getNodes,
      getNode: getNode,
      getPortsWithNode: getPortsWithNode,
      putNodeInMaintenanceMode: putNodeInMaintenanceMode,
      removeNodeFromMaintenanceMode: removeNodeFromMaintenanceMode,
      powerOnNode: powerOnNode,
      powerOffNode: powerOffNode
    };

    return service;

    ///////////

    /**
     * @name horizon.app.core.openstack-service-api.ironic.getNodes
     * @description Retrieve a list of nodes
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#get--v1-nodes
     *
     * @return Node collection in JSON
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#NodeCollection
     */

    function getNodes() {
      return apiService.get('/api/ironic/nodes/')
        .error(function() {
          toastService.add('error', gettext('Unable to retrieve Ironic nodes.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.ironic.getNode
     * @description Retrieve information about the given node.
     *
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#get--v1-nodes-(node_ident)
     *
     * @param {string} uuid – UUID or logical name of a node.
     */

    function getNode(uuid) {
      return apiService.get('/api/ironic/nodes/' + uuid).error(function() {
        toastService.add('error', gettext('Unable to retrieve the Ironic node.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.ironic.getPortsWithNode
     * @description Retrieve a list of ports associated with a node.
     *
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#get--v1-ports
     *
     * @param {string} uuid – UUID or logical name of a node.
     */

    function getPortsWithNode(uuid) {
      var config = {
        'params' : {
          node_id: uuid
        }
      };
      return apiService.get('/api/ironic/ports/', config).error(function() {
        toastService.add('error', gettext('Unable to retrieve the Ironic node ports.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.ironic.putNodeInMaintenanceMode
     * @description Put the node in maintenance mode.
     *
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#put--v1-nodes-(node_ident)-maintenance
     *
     * @param {string} uuid – UUID or logical name of a node.
     */

    function putNodeInMaintenanceMode(uuid, reason) {
      var data = {
        maint_reason: (reason ? reason : gettext("No maintenance reason given."))
      };
      return apiService.patch('/api/ironic/nodes/' + uuid + '/maintenance', data).error(function() {
        toastService.add('error',
            gettext('Unable to put the Ironic node in maintenance mode.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.ironic.removeNodeFromMaintenanceMode
     * @description Remove the node from maintenance mode.
     *
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#delete--v1-nodes-(node_ident)-maintenance
     *
     * @param {string} uuid – UUID or logical name of a node.
     */

    function removeNodeFromMaintenanceMode(uuid) {
      return apiService.delete('/api/ironic/nodes/' + uuid + '/maintenance').error(function() {
        toastService.add('error',
            gettext('Unable to remove the Ironic node from maintenance mode.'));
      });
    }

    /**
     * @name horizon.app.core.openstack-service-api.ironic.powerOnNode
     * @description Set the power state of the node.
     *
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#put--v1-nodes-(node_ident)-states-power
     *
     * @param {string} uuid – UUID or logical name of a node.
     */

    function powerOnNode(uuid) {
      var data = {
        state: 'on'
      };
      return apiService.patch('/api/ironic/nodes/' + uuid + '/states/power', data)
        .error(function () {
          toastService.add('error', gettext('Unable to power on the node'));
        });
    }

    /**
     * @name horizon.app.core.openstack-service-api.ironic.powerOffNode
     * @description Set the power state of the node.
     *
     * http://docs.openstack.org/developer/ironic/webapi/v1.html#put--v1-nodes-(node_ident)-states-power
     *
     * @param {string} uuid – UUID or logical name of a node.
     */

    function powerOffNode(uuid) {
      var data = {
        state: 'off'
      };
      return apiService.patch('/api/ironic/nodes/' + uuid + '/states/power', data)
        .error(function () {
          toastService.add('error', gettext('Unable to power off the node'));
        });
    }
  }

}());
