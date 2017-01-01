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
      var service;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(module(function($provide) {
        $provide.value('$uibModal', jasmine.createSpy());
      }));

      beforeEach(inject(function($injector) {
        service =
          $injector.get('horizon.dashboard.admin.ironic.base-node.service');
      }));

      it('defines the service', function() {
        expect(service).toBeDefined();
      });

      describe('DriverProperty', function() {
        it('Base construction', function() {
          var propertyName = 'propertyName';
          var description = '';
          var propertySet = [];
          var property = new service.DriverProperty(propertyName,
                                                    description,
                                                    propertySet);
          expect(property.name).toBe(propertyName);
          expect(property.desc).toBe(description);
          expect(property.propertySet).toBe(propertySet);
          expect(property.getSelectOptions()).toBe(null);
          expect(property.required).toBe(false);
          expect(property.defaultValue).toBe(undefined);
          expect(property.inputValue).toBe(undefined);
          expect(property.getInputValue()).toBe(undefined);
          expect(property.isActive()).toBe(true);
        });

        it('Required - ends with', function() {
          var property = new service.DriverProperty('propertyName',
                                                    ' Required.',
                                                    []);
          expect(property.required).toBe(true);
        });

        it('Not required - missing space', function() {
          var property = new service.DriverProperty('propertyName',
                                                    'Required.',
                                                    []);
          expect(property.required).toBe(false);
        });

        it('Not required - missing period', function() {
          var property = new service.DriverProperty('propertyName',
                                                    ' Required',
                                                    []);
          expect(property.required).toBe(false);
        });

        it('Select options', function() {
          var property = new service.DriverProperty(
            'propertyName',
            'One of "foo", bar.',
            []);
          expect(property.getSelectOptions()).toEqual(['foo', 'bar']);
        });

        it('Select options - No single quotes', function() {
          var property = new service.DriverProperty(
            'propertyName',
            "One of 'foo', bar.",
            []);
          expect(property.getSelectOptions()).toEqual(["'foo'", 'bar']);
        });

        it('default - is string', function() {
          var property = new service.DriverProperty(
            'propertyName',
            'default is "5.1".',
            []);
          expect(property._getDefaultValue()).toEqual('5.1');
        });

        it('default - period processing', function() {
          var property = new service.DriverProperty(
            'propertyName',
            'default is 5.1.',
            []);
          expect(property._getDefaultValue()).toEqual('5');
        });
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
          var prop1 = new service.DriverProperty("prop1", "", propertySet);
          propertySet.prop1 = prop1;
          var prop2 = new service.DriverProperty("prop2", "", propertySet);
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
