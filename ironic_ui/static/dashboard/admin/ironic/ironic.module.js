/*
 * © Copyright 2015,2016 Hewlett Packard Enterprise Development Company LP
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

  /**
   * @ngdoc overview
   * @ngname horizon.dashboard.admin.ironic
   *
   * @description
   * Provides all of the services and widgets required
   * to support and display Ironic related content.
   */
  angular
    .module('horizon.dashboard.admin.ironic', [])
    .config(config);

  config.$inject = ['$provide', '$windowProvider'];

  function config($provide, $windowProvider) {
    $provide.constant('horizon.dashboard.admin.ironic.validHostNamePattern',
                      '^(([a-zA-Z0-9]|[a-zA-Z0-9][a-zA-Z0-9\\-]*[a-zA-Z0-9])\\.)*([A-Za-z0-9]|[A-Za-z0-9][A-Za-z0-9\\-]*[A-Za-z0-9])$'); // eslint-disable-line max-len

    $provide.constant('horizon.dashboard.admin.ironic.validUuidPattern',
                      '^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$'); // eslint-disable-line max-len

    $provide.constant('horizon.dashboard.admin.ironic.validMacAddressPattern',
                      '^[0-9A-Fa-f]{2}(:[0-9A-Fa-f]{2}){5}$'); // eslint-disable-line max-len

    $provide.constant('horizon.dashboard.admin.ironic.validDatapathIdPattern',
                      '^[0-9A-Fa-f]{16}$'); // eslint-disable-line max-len

    var path = $windowProvider.$get().STATIC_URL + 'dashboard/admin/ironic/';
    $provide.constant('horizon.dashboard.admin.ironic.basePath', path);

    var events = {
      ENROLL_NODE_SUCCESS:'horizon.dashboard.admin.ironic.ENROLL_NODE_SUCCESS',
      DELETE_NODE_SUCCESS:'horizon.dashboard.admin.ironic.DELETE_NODE_SUCCESS',
      EDIT_NODE_SUCCESS:'horizon.dashboard.admin.ironic.EDIT_NODE_SUCCESS',
      CREATE_PORT_SUCCESS:'horizon.dashboard.admin.ironic.CREATE_PORT_SUCCESS',
      DELETE_PORT_SUCCESS:'horizon.dashboard.admin.ironic.DELETE_PORT_SUCCESS',
      EDIT_PORT_SUCCESS:'horizon.dashboard.admin.ironic.EDIT_PORT_SUCCESS'
    };
    $provide.constant('horizon.dashboard.admin.ironic.events', events);

    $provide.constant('horizon.dashboard.admin.ironic.driverInterfaces',
                      ['boot',
                       'console',
                       'deploy',
                       'inspect',
                       'management',
                       'network',
                       'power',
                       'raid',
                       'storage',
                       'vendor']);
  }
})();
