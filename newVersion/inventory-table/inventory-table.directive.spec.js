describe('inventory-table directive', () => {
	var $httpBackend, $rootScope, TestData, apiService, moveBoardApi, $scope, $compile, element, config;

	beforeEach(module('app'));
	beforeEach(module('newInventories'));

	beforeEach(module('ngMockE2E'));

	beforeEach(inject(function (_$httpBackend_, _$rootScope_, _$compile_, _config_, _TestData_) {
		$httpBackend = _$httpBackend_;
		$rootScope = _$rootScope_;
		$compile = _$compile_;
		config = _config_;
		TestData = _TestData_;
		$scope = $rootScope.$new();

		$httpBackend.whenPOST(config.serverUrl + 'server/clients/getcurrent').respond(200, TestData.getcurrent);
		$httpBackend.whenGET(/^tepmlates\//).passThrough();
	}));

	describe('roomClass should be', () => {
		it ('default 4', () => {
			element = angular.element("<inventory-table></inventory-table>");
			$compile(element)($scope);
			let isolatedScope = element.isolateScope();
			expect(isolatedScope.roomClass).toEqual("col-md-4");
		});
		it ('set to 3', () => {
			element = angular.element("<inventory-table column-width='3'></inventory-table>");
			$compile(element)($scope);
			let isolatedScope = element.isolateScope();
			expect(isolatedScope.roomClass).toEqual("col-md-3");
		});
	});

	describe('rooms filter', () => {
		let isolatedScope;
		beforeEach(() => {
			element = angular.element("<inventory-table></inventory-table>");
			$compile(element)($scope);
			isolatedScope = element.isolateScope();
		});

		it('Not empty rooms returns > 0', () => {
			expect(isolatedScope.emptyRooms({total_count: 2})).toBeGreaterThan(0);
		});
		it('empty rooms returns false when total_count 0', () => {
			expect(isolatedScope.emptyRooms({total_count: 0})).toBeFalsy();
		});
		it('empty rooms returns false total_count ""', () => {
			expect(isolatedScope.emptyRooms({total_count: ''})).toBeFalsy();
		});
		it('empty rooms returns false total_count undefined', () => {
			expect(isolatedScope.emptyRooms({})).toBeFalsy();
		});
	});

	describe('items filter', () => {
		let isolatedScope;
		beforeEach(() => {
			element = angular.element("<inventory-table></inventory-table>");
			$compile(element)($scope);
			isolatedScope = element.isolateScope();
		});

		it('Not empty items returns > 0', () => {
			expect(isolatedScope.emptyItem({totals:{total_count: 2}})).toBeGreaterThan(0);
		});
		it('empty items returns false when total_count 0', () => {
			expect(isolatedScope.emptyItem({totals:{total_count: 0}})).toBeFalsy();
		});
		it('empty items returns false total_count ""', () => {
			expect(isolatedScope.emptyItem({totals:{total_count: ''}})).toBeFalsy();
		});
		it('empty items returns false total_count undefined', () => {
			expect(isolatedScope.emptyItem({totals:{}})).toBeFalsy();
		});
		it('empty items returns false total_count undefined', () => {
			expect(isolatedScope.emptyItem({})).toBeFalsy();
		});
	});

	describe('init function', () => {
		it('must do request to api when no rooms attr', () => {
			rooms = ['Received'];
			$httpBackend.expectGET(config.serverUrl + 'server/move_inventory_room?entity_id=1234&entity_type=0&with_filters=1&with_items_total=1').respond(200, rooms);
			element = angular.element("<inventory-table entity-id='1234'></inventory-table>");
			$compile(element)($scope);
			let isolatedScope = element.isolateScope();
			isolatedScope.$digest();
			$httpBackend.flush();
			expect(isolatedScope.roomsHolder.rooms[0]).toBe('Received');
		});
		it('must NOT do request to api when exist rooms attr', () => {
			$scope.initRooms = {rooms: ['Presetted']};
			element = angular.element("<inventory-table entity-id='1234' rooms='initRooms'></inventory-table>");
			$compile(element)($scope);
			let isolatedScope = element.isolateScope();
			isolatedScope.$digest();
			expect(isolatedScope.roomsHolder.rooms[0]).toBe('Presetted');
		});
	});
});