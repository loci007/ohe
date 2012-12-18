/*globals angular */

(function () {
    angular.module('channels', ['messages', 'users', 'ui', 'channelState',
    function ($routeProvider, $locationProvider, $httpProvider) {
        var interceptor = ['$q', function ($q) {
            var success = function (response) {
                return response;
            };
            var error = function (response) {
                var status = response.status;
                if (status === 401) {
                    window.location.href = window.location.href;
                }
                return $q.reject(response);
            };
            return function (promise) {
                return promise.then(success, error);
            };
        }];
        $httpProvider.responseInterceptors.push(interceptor);
    }
    ]).config(function ($routeProvider) {
        $routeProvider.when('/', {
            controller: 'ChannelListCtrl',
            templateUrl: '/static/templates/channel-list.html',
            selectedNav: 'inbox'
        }).when('/channel/:channel_id', {
            template: '<channel-detail></channel-detail>'
        });
    }).directive('channelDetail', function ($timeout) {
        return {
            restrict: 'E',
            controller: 'ChannelDetailCtrl',
            templateUrl: '/static/templates/channel-detail.html'
        };
    }).factory('Channel', function ($q, $rootScope, $http, User, Message) {
        var Channel = function (data) {
            if (data) {
                angular.extend(this, data);
                this.creator = new User(data.creator);
            }

            this.subscribers = [];
            this._subscribers_loaded = false;
            this.messages = [];
            this._messages_loaded = false;
            this.recent_message = undefined;
            this._recent_message_loaded = false;
        };

        Channel.prototype.detail_url = function () {
            return '/channel/' + this.id;
        };

        Channel.prototype.get_subscribers = function () {
            return _.pluck(this.subscribers, 'name');
        };

        return Channel;
    }).controller('ChannelListCtrl', function ($scope, $location, Channel, Message, channelState) {
        $scope.has_more_channels = true;
        $scope.num_to_fetch = 10;

        channelState.query_channels($scope.num_to_fetch, false);

        $scope.selectedUsers = [];
        $scope.message = "";

        $scope.createUser = function () {
            Message.auto_create(_.pluck($scope.selectedUsers, 'id'), $scope.message).then(function (channel_id) {
                if (channel_id) {
                    $location.path('/channel/' + channel_id);
                }
            });
        };

        $scope.loadOlderChannels = function () {
            channelState.query_channels($scope.num_to_fetch, true).then(function (channels) {
                if (!channels.length) {
                    $scope.has_more_channels = false;
                }
            });
        };

    }).controller('ChannelDetailCtrl', function ($scope, $element, $timeout, channelState, $routeParams) {
        channelState.get_channel($routeParams.channel_id).then(function (channel) {
            $scope.channel = channel;
        });
    });
})();
