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

  /**
   * @description Unit tests for the Ironic node state transition service
   */

  describe(
    'horizon.dashboard.admin.ironic.node-state-transition.service',

    function() {
      var nodeStateTransitionService;

      beforeEach(module('horizon.dashboard.admin.ironic'));

      beforeEach(inject(function($injector) {
        nodeStateTransitionService = $injector.get(
          'horizon.dashboard.admin.ironic.node-state-transition.service');
      }));

      it('nodeStateTransitionService', function() {
        expect(nodeStateTransitionService).toBeDefined();
      });

      it('known states', function() {
        var knownStates = ['enroll',
                           'manageable',
                           'active',
                           'available',
                           'adopt failed',
                           'clean failed',
                           'inspect failed',
                           'clean wait',
                           'deploy failed',
                           'error'].sort();
        expect(nodeStateTransitionService.getKnownStates().sort())
          .toEqual(knownStates);
      });

      function validateTransition(transition) {
        var serviceTransitions =
          nodeStateTransitionService.getTransitions(transition.source);
        for (var i = 0; i < serviceTransitions.length; i++) {
          var serviceTransition = serviceTransitions[i];
          if (serviceTransition.source === transition.source &&
              serviceTransition.target === transition.target &&
              serviceTransition.verb === transition.verb) {
            expect(serviceTransition.label).toBeDefined();
            return true;
          }
        }
        return false;
      }

      it('enroll - manage - manageable', function() {
        expect(validateTransition({source: 'enroll',
                                   target: 'manageable',
                                   verb: 'manage'})).toBe(true);
      });

      it('manageable - adopt - active', function() {
        expect(validateTransition({source: 'manageable',
                                   target: 'active',
                                   verb: 'adopt'})).toBe(true);
      });

      it('manageable - provide - available', function() {
        expect(validateTransition({source: 'manageable',
                                   target: 'available',
                                   verb: 'provide'})).toBe(true);
      });

      it('manageable - inspect - manageable', function() {
        expect(validateTransition({source: 'manageable',
                                   target: 'manageable',
                                   verb: 'inspect'})).toBe(true);
      });

      it('manageable - clean - manageable', function() {
        expect(validateTransition({source: 'manageable',
                                   target: 'manageable',
                                   verb: 'clean'})).toBe(true);
      });

      it('active - deleted - available', function() {
        expect(validateTransition({source: 'active',
                                   target: 'available',
                                   verb: 'deleted'})).toBe(true);
      });

      it('available - active - active', function() {
        expect(validateTransition({source: 'available',
                                   target: 'active',
                                   verb: 'active'})).toBe(true);
      });

      it('available - manage - manageable', function() {
        expect(validateTransition({source: 'available',
                                   target: 'manageable',
                                   verb: 'manage'})).toBe(true);
      });

      it('adopt failed - manage - manageable', function() {
        expect(validateTransition({source: 'adopt failed',
                                   target: 'manageable',
                                   verb: 'manage'})).toBe(true);
      });

      it('adopt failed - adopt - active', function() {
        expect(validateTransition({source: 'adopt failed',
                                   target: 'active',
                                   verb: 'adopt'})).toBe(true);
      });

      it('inspect failed - manage - manageable', function() {
        expect(validateTransition({source: 'inspect failed',
                                   target: 'manageable',
                                   verb: 'manage'})).toBe(true);
      });

      it('clean wait - abort - clean failed', function() {
        expect(validateTransition({source: 'clean wait',
                                   target: 'clean failed',
                                   verb: 'abort'})).toBe(true);
      });

      it('clean failed - manage - manageable', function() {
        expect(validateTransition({source: 'clean failed',
                                   target: 'manageable',
                                   verb: 'manage'})).toBe(true);
      });

      it('deploy failed - active - active', function() {
        expect(validateTransition({source: 'deploy failed',
                                   target: 'active',
                                   verb: 'active'})).toBe(true);
      });

      it('deploy failed - delete - manageable', function() {
        expect(validateTransition({source: 'deploy failed',
                                   target: 'manageable',
                                   verb: 'deleted'})).toBe(true);
      });

      it('error - rebuild - active', function() {
        expect(validateTransition({source: 'error',
                                   target: 'active',
                                   verb: 'rebuild'})).toBe(true);
      });

      it('error - deleted - manageable', function() {
        expect(validateTransition({source: 'error',
                                   target: 'manageable',
                                   verb: 'deleted'})).toBe(true);
      });

      it('foo - bar - baz', function() {
        expect(validateTransition({source: 'foo',
                                   target: 'baz',
                                   verb: 'bar'})).toBe(false);
      });
    });
})();
