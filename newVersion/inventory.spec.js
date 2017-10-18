describe('Unit: Inventory directive', function () {
	var $httpBackend, $rootScope, TestData, $state, $compile, $scope, element, $timeout, $templateCache, scope, config;
	beforeEach(module('app'));
	beforeEach(module('my.templates'));
	beforeEach(module('newInventories'));

	beforeEach(module('ngMockE2E'));

	beforeEach(inject(function (_$httpBackend_, _$rootScope_, _$state_, _TestData_, _$compile_, _$timeout_, _$templateCache_, _config_) {
		$httpBackend = _$httpBackend_;
		$rootScope = _$rootScope_;
		$state = _$state_;
		TestData = _TestData_;
		$compile = _$compile_;
		$scope = $rootScope.$new();
		$timeout = _$timeout_;
		$templateCache = _$templateCache_;
		config = _config_;

		$scope.request = TestData.request;

		element = $compile("<div inventories request='request'></div>")($scope);

		$httpBackend.whenPOST(config.serverUrl + 'server/clients/getcurrent').respond(200, TestData.getcurrent);
		$httpBackend.whenGET(config.serverUrl + 'server/move_inventory_room?entity_id=100&entity_type=0&with_filters=1&with_items_total=1').respond(200, TestData.move_inventory_room);
		$httpBackend.whenGET(config.serverUrl + 'server/move_inventory_room?entity_type=0&with_filters=1&with_items_total=1').respond(200, TestData.move_inventory_room);
		$httpBackend.whenPOST(config.serverUrl + 'server/move_inventory_item/getItems').respond(200, TestData.move_inventory_room__getItems);
		$httpBackend.whenGET(/.*/).passThrough();
		$scope.$apply();
		scope = element.isolateScope();
	}));


	it('Open room', function () {
		$timeout.flush();
		scope.openRoom(scope.rooms[0]);
		expect(scope.rooms[0].opened).toEqual(true);
	}).disable();

	it('Open filter', function () {
		$timeout.flush();
		scope.setFilter(scope.rooms[0].filters[0]);
		expect(scope.inventoryItems.length).toEqual(26);
	}).disable();

});
