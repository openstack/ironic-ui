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
    .factory('horizon.dashboard.admin.ironic.base-node.service',
             baseNodeService);

  baseNodeService.$inject = [];

  function baseNodeService() {
    var service = {
      driverPropertyGroupHasRequired: driverPropertyGroupHasRequired,
      driverPropertyGroupsToString: driverPropertyGroupsToString,
      compareDriverPropertyGroups: compareDriverPropertyGroups
    };

    /**
     * @description Check whether a group contains required properties
     *
     * @param {DriverProperty[]} group - Property group
     * @return {boolean} Return true if the group contains required
     *   properties, false otherwise
     */
    function driverPropertyGroupHasRequired(group) {
      var hasRequired = false;
      for (var i = 0; i < group.length; i++) {
        if (group[i].required) {
          hasRequired = true;
          break;
        }
      }
      return hasRequired;
    }

    /**
     * @description Convert array of driver property groups to a string
     *
     * @param {array[]} groups - Array of driver property groups
     * @return {string} Output string
     */
    function driverPropertyGroupsToString(groups) {
      var output = [];
      angular.forEach(groups, function(group) {
        var groupStr = [];
        angular.forEach(group, function(property) {
          groupStr.push(property.name);
        });
        groupStr = groupStr.join(", ");
        output.push(['[', groupStr, ']'].join(""));
      });
      output = output.join(", ");
      return ['[', output, ']'].join("");
    }

    /**
     * @description Comaprison function used to sort driver property groups
     *
     * @param {DriverProperty[]} group1 - First group
     * @param {DriverProperty[]} group2 - Second group
     * @return {integer} Return:
     * < 0 if group1 should precede group2 in an ascending ordering
     * > 0 if group2 should precede group1
     * 0 if group1 and group2 are considered equal from ordering perpsective
     */
    function compareDriverPropertyGroups(group1, group2) {
      var group1HasRequired = driverPropertyGroupHasRequired(group1);
      var group2HasRequired = driverPropertyGroupHasRequired(group2);

      if (group1HasRequired === group2HasRequired) {
        if (group1.length === group2.length) {
          return group1[0].name.localeCompare(group2[0].name);
        } else {
          return group1.length - group2.length;
        }
      } else {
        return group1HasRequired ? -1 : 1;
      }
      return 0;
    }

    return service;
  }
})();
