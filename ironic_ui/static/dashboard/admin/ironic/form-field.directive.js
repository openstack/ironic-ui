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
(function () {
  'use strict';

  angular
    .module('horizon.dashboard.admin.ironic')
    .directive('formField', FormField);

  FormField.$inject = [
    '$timeout',
    '$compile',
    'horizon.dashboard.admin.ironic.basePath'
  ];

  function FormField($timeout, $compile, basePath) {
    return {
      restrict: 'E',
      scope: {
        field: '=',
        form: '='
      },
      templateUrl: basePath + '/form-field.html',
      link: function(scope, element) {
        // Process the auto-focus attribute
        if (scope.field.autoFocus) {
          // Need to defer processing until the DOM is fully instantiated
          $timeout(function() {
            var inputs = element.find('input');
            if (inputs[0]) {
              inputs.attr('auto-focus', '');
              $compile(element.contents())(scope);
            }
          });
        }
      }
    };
  }
})();
