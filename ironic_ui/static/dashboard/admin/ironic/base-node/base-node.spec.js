/**
 * Copyright 2016 Cray Inc
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function() {
  "use strict";

  describe(
    'horizon.dashboard.admin.ironic.base-node.service',
    function() {
      var service, driverPropertyService;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(inject(function($injector) {
        service =
          $injector.get('horizon.dashboard.admin.ironic.base-node.service');

        driverPropertyService =
          $injector.get('horizon.dashboard.admin.ironic.driver-property.service');
      }));

      it('defines the service', function() {
        expect(service).toBeDefined();
      });

      describe('DriverPropertyGroup', function() {
        it('driverPropertyGroupHasRequired', function () {
          var dp1 =
            new driverPropertyService.DriverProperty("dp-1", " Required.", []);
          var dp2 =
            new driverPropertyService.DriverProperty("dp-2", " ", []);

          expect(service.driverPropertyGroupHasRequired).toBeDefined();
          expect(service.driverPropertyGroupHasRequired([])).toBe(false);
          expect(service.driverPropertyGroupHasRequired([dp1])).toBe(true);
          expect(service.driverPropertyGroupHasRequired([dp2])).toBe(false);
          expect(service.driverPropertyGroupHasRequired([dp1, dp2])).toBe(true);
        });

        it('driverPropertyGroupsToString', function () {
          var dp1 =
            new driverPropertyService.DriverProperty("dp-1", " Required.", []);
          var dp2 =
            new driverPropertyService.DriverProperty("dp-2", " ", []);

          expect(service.driverPropertyGroupsToString).toBeDefined();
          expect(service.driverPropertyGroupsToString([])).toBe("[]");
          expect(service.driverPropertyGroupsToString([[dp1]]))
            .toBe("[[dp-1]]");
          expect(service.driverPropertyGroupsToString([[dp1], [dp2]]))
            .toBe("[[dp-1], [dp-2]]");
        });

        it('compareDriverPropertyGroups', function () {
          var dp1 =
            new driverPropertyService.DriverProperty("dp-1", " Required.", []);
          var dp2 =
            new driverPropertyService.DriverProperty("dp-2", " ", []);

          expect(service.compareDriverPropertyGroups).toBeDefined();
          expect(service.compareDriverPropertyGroups([dp1], [dp1])).toBe(0);
          expect(service.compareDriverPropertyGroups([dp1], [dp2])).toBe(-1);
          expect(service.compareDriverPropertyGroups([dp2], [dp1])).toBe(1);
          // smaller group precedes larger group
          expect(service.compareDriverPropertyGroups([dp1], [dp1, dp2]))
            .toBe(-1);
          // group order decided on lexographic comparison of names of first
          // property
          expect(service.compareDriverPropertyGroups([dp2, dp1], [dp1, dp2]))
            .toBe(1);
        });
      });
    });
})();
