/**
 * Copyright 2017 Cray Inc
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
    'horizon.dashboard.admin.ironic.postfix-expr.service',
    function() {
      var service, driverPropertyService;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(inject(function($injector) {
        service = $injector.get(
          'horizon.dashboard.admin.ironic.postfix-expr.service');
        driverPropertyService = $injector.get(
          'horizon.dashboard.admin.ironic.driver-property.service');
      }));

      it('defines the service', function() {
        expect(service).toBeDefined();
      });

      describe('PostfixExpr', function() {
        it('Base construction', function() {
          var expr = new service.PostfixExpr();
          var ret = expr.evaluate({});
          expect(ret[0]).toBe(service.PostfixExpr.status.MALFORMED);
          expect(ret[1]).toBe(service.PostfixExpr.UNDEFINED);
        });

        function evalBinary(val1, val2, op) {
          var propertySet = {};
          var prop1 =
            new driverPropertyService.DriverProperty("prop1", "", propertySet);
          propertySet.prop1 = prop1;
          var prop2 =
            new driverPropertyService.DriverProperty("prop2", "", propertySet);
          propertySet.prop2 = prop2;

          var expr = new service.PostfixExpr();
          expr.addProperty("prop1");
          expr.addProperty("prop2");
          prop1.inputValue = val1;
          prop2.inputValue = val2;
          expr.addOperator(op);
          return expr.evaluate(propertySet);
        }

        it('T and T', function() {
          var ret = evalBinary(true, true, service.PostfixExpr.op.AND);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('T and F', function() {
          var ret = evalBinary(true, false, service.PostfixExpr.op.AND);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('F and T', function() {
          var ret = evalBinary(false, true, service.PostfixExpr.op.AND);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('F and F', function() {
          var ret = evalBinary(false, false, service.PostfixExpr.op.AND);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('T or T', function() {
          var ret = evalBinary(true, true, service.PostfixExpr.op.OR);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('T or F', function() {
          var ret = evalBinary(true, false, service.PostfixExpr.op.OR);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('F or T', function() {
          var ret = evalBinary(false, true, service.PostfixExpr.op.OR);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('F or F', function() {
          var ret = evalBinary(false, false, service.PostfixExpr.op.OR);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('T eq T', function() {
          var ret = evalBinary(true, true, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('T eq F', function() {
          var ret = evalBinary(true, false, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('F eq T', function() {
          var ret = evalBinary(false, true, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('F eq F', function() {
          var ret = evalBinary(false, false, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('1 eq 1', function() {
          var ret = evalBinary(1, 1, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(true);
        });

        it('1 eq 0', function() {
          var ret = evalBinary(1, 0, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });

        it('"1" eq 1', function() {
          var ret = evalBinary('1', 1, service.PostfixExpr.op.EQ);
          expect(ret[0]).toBe(service.PostfixExpr.status.OK);
          expect(ret[1]).toBe(false);
        });
      });
    });
})();
