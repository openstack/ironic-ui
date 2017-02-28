/*
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
    .module('horizon.dashboard.admin.ironic')
    .service('horizon.dashboard.admin.ironic.node-state-transition.service',
             nodeStateTransitionService);

  nodeStateTransitionService.$inject = [];

  /**
   * @description Utility service for working with the node state machine
   * @return {void}
   */
  function nodeStateTransitionService() {
    // Dictionary of NodeState objects indexed by state name
    var states = {};

    // Create node state objects
    angular.forEach(['enroll',
                     'manageable',
                     'active',
                     'available',
                     'adopt failed',
                     'clean failed',
                     'inspect failed',
                     'clean wait',
                     'deploy failed',
                     'error'],
                    function(state) {
                      states[state] = new NodeState(state);
                    });

    // Add state transitions

    states.enroll.addTransition('manageable', 'manage');

    states.manageable.addTransition('active', 'adopt');
    states.manageable.addTransition('available', 'provide');
    states.manageable.addTransition('manageable',
                                    'inspect',
                                    gettext('Inspect'));
    states.manageable.addTransition('manageable',
                                    'clean',
                                    gettext('Clean'));

    states.active.addTransition('available', 'deleted');

    states.available.addTransition('active', 'active');
    states.available.addTransition('manageable', 'manage');

    states['adopt failed'].addTransition('manageable', 'manage');
    states['adopt failed'].addTransition('active', 'adopt');

    states['inspect failed'].addTransition('manageable', 'manage');

    states['clean wait'].addTransition('clean failed',
                                       'abort',
                                       gettext('Abort cleaning'));

    states['clean failed'].addTransition('manageable', 'manage');

    states['deploy failed'].addTransition('active', 'active');
    states['deploy failed'].addTransition('manageable', 'deleted');

    states.error.addTransition('active', 'rebuild');
    states.error.addTransition('manageable', 'deleted');

    /**
     * @description Class constructor for NodeState object.
     * A NodeState maintains a set of transitions to other states.
     *
     * @param {name} name – Name of state
     * @return {void}
     */
    function NodeState(name) {
      this.name = name;
      this.transitions = {};

      /**
       * @description Add a transition to a specified target state.
       *
       * @param {string} target – Name of target state
       * @param {string} verb – Verb used to accomplish transition
       * @param {string} label – Description of the transition. Optional.
       * @return {void}
       */
      this.addTransition = function(target, verb, label) {
        this.transitions[verb] =
          {source: this.name,
           target: target,
           verb: verb,
           label: angular.isDefined(label)
           ? label : gettext("Move to") + " " + target};
      };

      /**
       * @description Get the transition object associated with a
       * specified target state.
       *
       * @param {string} targetState – Name of target state
       * @return {object} Transition object. A value of null
       * is returned if a transition does not exist.
       */
      this.getTransition = function(targetState) {
        return this.transitions.hasOwnProperty(targetState)
          ? this.transitions[targetState] : null;
      };
    }

    this.getTransitions = function(sourceState) {
      var transitions = [];
      if (states.hasOwnProperty(sourceState)) {
        angular.forEach(states[sourceState].transitions,
                        function(transition) {
                          transitions.push(transition);
                        });
      }
      return transitions;
    };
  }
}());
