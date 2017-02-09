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
   * @ngdoc controller
   * @name horizon.dashboard.admin.ironic:CleanNodeController
   * @ngController
   *
   * @description
   * Controller used to prompt the user for a list of clean-steps
   * in JSON format that will be applied a node
   */
  angular
    .module('horizon.dashboard.admin.ironic')
    .controller('CleanNodeController', CleanNodeController);

  CleanNodeController.$inject = [
    '$uibModalInstance'
  ];

  function CleanNodeController($uibModalInstance) {
    var ctrl = this;

    ctrl.errMsg = '';

    ctrl.cancel = function() {
      $uibModalInstance.dismiss('cancel');
    };

    ctrl.clean = function(cleanSteps) {
      try {
        var steps = JSON.parse(cleanSteps);
        if (angular.isArray(steps) && steps.length > 0) {
          var valid = true;
          angular.forEach(steps, function(step) {
            if (angular.isUndefined(step.interface) ||
                angular.isUndefined(step.step)) {
              valid = false;
            }
          });
          if (valid) {
            $uibModalInstance.close(steps);
          } else {
            ctrl.errMsg = gettext('Each cleaning step must be an object that contains "interface" and "step" properties'); // eslint-disable-line max-len
          }
        } else {
          ctrl.errMsg = gettext('Clean steps should be an non-empty array');
        }
      } catch (e) {
        ctrl.errMsg = gettext('Unable to validate the JSON input');
      }
    };
  }
})();
