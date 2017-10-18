describe('Unit: Inventory item directive test', function () {
	var $httpBackend, $rootScope, TestData, $state, $compile, $scope, element, config, scope;
	const ADD_ITEM_SELECTOR = '.simple-item .js-counter[data-count=1]';
	const REMOVE_ITEM_SELECTOR = '.simple-item .js-counter[data-count=-1]';

	function addItem() {
		element.find(ADD_ITEM_SELECTOR).trigger('click');
	}

	function removeItem() {
		element.find(REMOVE_ITEM_SELECTOR).trigger('click');
	}
	beforeEach(module('app'));
	beforeEach(module('newInventories'));

	beforeEach(module('ngMockE2E'));

	beforeEach(inject(function (_$httpBackend_, _$rootScope_, _$state_, _TestData_, _$compile_, _config_) {
		$httpBackend = _$httpBackend_;
		$rootScope = _$rootScope_;
		$state = _$state_;
		TestData = _TestData_;
		$compile = _$compile_;
		config = _config_;
		$scope = $rootScope.$new();
		$scope.item = {
			cf: "22",
			extra_service: "0",
			filters: ["1"],
			handle_fee: "0",
			image_link: config.serverUrl + "/sites/default/files/inventory/Boudoir-chair.jpg",
			item_id: "2",
			name: "Loveseat",
			packing_fee: "0",
			price: "0",
			status: "0",
			totals: {
				total_cf: "22",
				total_count: "15"
			},
			type: 1,
			visible: true,
			weight: "0"
		};

		$scope.room = {
			created: "1498225189",
			filters: [
				{
					active: true,
					filter_id: "1",
					items: [],
					name: "Sofa, Chair",
					rooms: [],
					totals: {
						total_cf: "785",
						total_count: "79"
					},
					type: "0",
					weight: "0"
				},
				{
					active: true,
					filter_id: "11",
					items: [],
					name: "Bed, Mattress",
					rooms: [],
					totals: {
						total_cf: "785",
						total_count: "79"
					},
					type: "0",
					weight: "0"
				},
				{
					active: true,
					filter_id: "12",
					items: [],
					name: "Boxes, Totes",
					rooms: [],
					totals: {
						total_cf: "785",
						total_count: "79"
					},
					type: "0",
					weight: "0"
				},
				{
					active: true,
					filter_id: "13",
					items: [],
					name: "Miscellaneous",
					rooms: [],
					totals: {
						total_cf: "785",
						total_count: "79"
					},
					type: "0",
					weight: "0"
				},
				{
					active: true,
					filter_id: "14",
					items: [],
					name: "Dresser, Mirror",
					rooms: [],
					totals: {
						total_cf: "785",
						total_count: "79"
					},
					type: "0",
					weight: "0"
				},
				{
					active: true,
					filter_id: "15",
					items: [],
					name: "Soffaaaaa",
					rooms: [],
					totals: {
						total_cf: "785",
						total_count: "79"
					},
					type: "0",
					weight: "0"
				}
			],
			image_link: "/moveBoard/content/img/icons/boxes.png",
			name: "All",
			opened: true,
			room_id: "15",
			total_cf: "1207",
			total_count: "111",
			type: "0",
			weight: "0"
		};

		$scope.filter = {
			active: true,
			filter_id: "1",
			items: [],
			name: "Sofa, Chair",
			rooms: [],
			totals: {
				total_cf: "785",
				total_count: "79"
			},
			type: "0",
			weight: "0"
		};
		$scope.request = angular.copy(TestData.request.request);

		element = $compile("<div new-inventory-item request='request' filter='filter' room='room' inventory-data='item'></div>")($scope);

		$httpBackend.whenPOST(config.serverUrl + 'server/clients/getcurrent').respond(200, TestData.getcurrent);
		$httpBackend.whenGET(config.serverUrl + 'server/move_inventory_room?entity_type=0&with_filters=1&with_items_total=1').respond(200, TestData.move_inventory_room);
		$httpBackend.whenPOST(config.serverUrl + 'server/move_inventory_item/add_item_to_request').respond(200, {});
		scope = element.isolateScope();

		$scope.$apply();
	}));


	it('Add one item to request', function () {
		addItem();
		expect(16).toEqual(scope.item.totals.total_count);
	});

	it('Remove one item from request', function () {
		removeItem();
		expect(14).toEqual(scope.item.totals.total_count);
	});

	describe('Should add extra service When', () => {
		beforeEach(() => {
			scope.item.extra_service = '10';
		});

		it('add item to request', function () {
			addItem();
			expect(scope.item.item_id).toEqual(scope.request.extraServices.pop().id);
		});

		it('add couple item to request', function () {
			addItem();
			addItem();
			expect(2).toEqual(scope.request.extraServices.pop().extra_services[1].services_default_value);
		});
	});

	describe('Should remove extra service When', () => {
		beforeEach(() => {
			scope.item.extra_service = '10';
			$scope.request.extraServices.push({id: $scope.item.item_id, extra_services: [{}, {services_default_value: 1}]});
		});

		it('remove item', () => {
			removeItem();
			expect(scope.request.extraServices.pop().id).toBeUndefined();
		});
	});


});
