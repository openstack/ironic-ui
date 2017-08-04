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

  angular
    .module('horizon.dashboard.admin.ironic')
    .factory('horizon.dashboard.admin.ironic.graph.service',
             graphService);

  graphService.$inject = [];

  function graphService() {

    var service = {
      Graph: Graph
    };

    /**
     * @description Class for representing and manipulating undirected
     * graphs
     *
     * @property {object} vertices - Associative array of vertex objects
     * indexed by property name
     * @return {object} Graph
     */
    function Graph() {
      this.vertices = {};
    }

    Graph.prototype.getVertex = function(vertexName) {
      var vertex = null;
      if (this.vertices.hasOwnProperty(vertexName)) {
        vertex = this.vertices[vertexName];
      }
      return vertex;
    };

    /**
     * @description Add a vertex to this graph
     *
     * @param {string} name - Vertex name
     * @param {object} data - Vertex data
     * @returns {object} - Newly created vertex
     */
    Graph.prototype.addVertex = function(name, data) {
      var vertex = {name: name, data: data, adjacents: []};
      this.vertices[name] = vertex;
      return vertex;
    };

    /**
     * @description Add an undirected edge between two vertices
     *
     * @param {string} vertexName1 - Name of first vertex
     * @param {string} vertexName2 - Name of second vertex
     * @returns {void}
     */
    Graph.prototype.addEdge = function(vertexName1, vertexName2) {
      this.vertices[vertexName1].adjacents.push(vertexName2);
      this.vertices[vertexName2].adjacents.push(vertexName1);
    };

    /**
     * @description Depth-first-search graph traversal utility function
     *
     * @param {object} vertex - Root vertex from which traveral will begin.
     * It is assumed that this vertex has not alreday been visited as part
     * of this traversal.
     * @param {object} visited - Associative array. Each named property
     * corresponds to a vertex with the same name, and has boolean value
     * indicating whether the vertex has been alreday visited.
     * @param {object[]} component - Array of vertices that define a strongly
     * connected component.
     * @returns {void}
     */
    Graph.prototype._dfsTraverse = function(vertex, visited, component) {
      var graph = this;
      visited[vertex.name] = true;
      component.push(vertex);

      /* eslint-disable no-unused-vars */
      angular.forEach(vertex.adjacents, function(vertexName) {
        if (!visited[vertexName]) {
          graph._dfsTraverse(graph.vertices[vertexName], visited, component);
        }
      });
      /* eslint-enable no-unused-vars */
    };

    /**
     * @description Perform a depth-first-search on a specified graph to
     * find strongly connected components. A user provided function will
     * be called to process each component.
     *
     * @param {function} componentFunc - Function called on each strongly
     * connected component. Accepts aruments: array of vertex objects, and
     * user-provided extra data that can be used in processing the component.
     * @param {object} extra - Extra data that is passed into the component
     * processing function.
     * @returns {void}
     */
    Graph.prototype.dfs = function(componentFunc, extra) {
      var graph = this;
      var visited = {};
      angular.forEach(
        graph.vertices,
        function(unused, name) {
          visited[name] = false;
        });

      angular.forEach(this.vertices, function(vertex, vertexName) {
        if (!visited[vertexName]) {
          var component = [];
          graph._dfsTraverse(vertex, visited, component);
          componentFunc(component, extra);
        }
      });
    };

    return service;
  }
})();
