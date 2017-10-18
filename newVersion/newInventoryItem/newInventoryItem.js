'use strict';
import './newInventoryItem.styl'

const UPDATE_ITEM_TIMEOUT = 500;

angular
	.module('newInventories')
	.directive('newInventoryItem', newInventoryItem);

function newInventoryItem(apiService, moveBoardApi) {
	return {
		scope: {
			item: '=inventoryData',
			room: "=",
			filter: "=",
			request: "=",
			packageId: "@",
			calcMyInventory: "&",
			removeItem: '=',
			inventoryType: '@',
			edit: '='
		},
		template: require('./newInventoryItem.pug'),
		restrict: 'A',
		link: linker
	};

	function linker($scope, element) {
		let value = 0;
		let total = 0;
		let $counterContent;
		let $addButton;
		let $itemCount;
		let updateItemTimeOut;
		let type = $scope.item.type || 1;
		let isCustomItem = type == 2;
		let updateItemUrl = makeAddItemUrl();
		let itemCF = Number($scope.item.cf);

		setUpTotals();

		$scope.remove = remove;

		$scope.isAccount = IS_ACCOUNT;
		$scope.itemName = $scope.item.name;

		if ($scope.item.extra_service && $scope.item.extra_service != "0") {
			element.find('.js-extraservice').css('display', 'block');
		} else {
			element.find('.js-extraservice').css('display', 'none');
		}

		$counterContent = element.find('.js-counter-conteiner');
		$addButton = element.find('.js-add-button');
		let itemCount = element.find('.js-inventory-item-count');
		$itemCount = angular.element(itemCount);

		if ($scope.item.totals) {
			total = Number($scope.item.totals.total_count);
			$itemCount.val(total);
		}

		if(IS_ACCOUNT && $scope.item.type == 2){
			$scope.itemName = $scope.itemName.split('(')[0];
		}

		showAddButton();

		element.find('.js-counter').on('click', onClickCounter);

		function onClickCounter(e) {
			value = Number(angular.element(e.currentTarget).attr('data-count'));

			if (value) {
				total += value;

				$itemCount.val(total);

				updateCount(value);
			}

			element.find('img').on('dblclick', e => e.preventDefault());
		}

		function setUpTotals() {
			$scope.item.totals = $scope.item.totals || {};
			$scope.item.totals.total_count = Number($scope.item.totals.total_count || 0);

			$scope.filter = $scope.filter || {};
			$scope.item.filter = $scope.filter;
			$scope.filter.totals = $scope.filter.totals || {};
			$scope.filter.totals.total_count = Number($scope.filter.totals.total_count || 0);

			$scope.room = $scope.room || {};
			$scope.room.items = $scope.room.items || [];

			if (isCustomItem) {
				$scope.room.total_custom_cf = Number($scope.room.total_custom_cf || 0);
				$scope.room.total_custom_count = Number($scope.room.total_custom_count || 0);
			} else {
				$scope.room.total_cf = Number($scope.room.total_cf || 0);
				$scope.room.total_count = Number($scope.room.total_count || 0);
			}
		}

		function makeAddItemUrl() {
			return isCustomItem ? moveBoardApi.inventory.request.addCustomItem : makeSimpleItem();
		}

		function makeSimpleItem() {
			return $scope.packageId ? moveBoardApi.inventory.package.addItemToPackage : moveBoardApi.inventory.request.addItem;
		}

		function updateCount(value) {
			$scope.item.totals.total_count += value;
			let totalCount = $scope.item.totals.total_count;

			let item = findItemInFilter();

			if (item && item.totals && item.totals.total_count !== totalCount) {
				item.totals.total_count = totalCount;
			}

			showAddButton();
			updateRoomTotals(value);

			$scope.filter.totals.total_count += value;

			updateRequestExtraService(value);

			if ($scope.packageId) {
				synchronizeItem($scope.item);
			}

			updateItem();

			$scope.calcMyInventory();
		}

		function findItemInFilter() {
			let id = $scope.item.id;
			let items = $scope.filter.items;
			return items && _.find(items, {id});
		}

		function updateRoomTotals(value) {
			setRoomTotalCount();
			setRoomTotalCf(value);
		}

		function setRoomTotalCount() {
			if (isCustomItem) {
				$scope.room.total_custom_count += value;
			} else {
				$scope.room.total_count += value;
			}
		}

		function setRoomTotalCf(value) {
			let totalCount = $scope.item.totals.total_count;
			let previousTotal = totalCount - value;
			let previousTotalCF = previousTotal * itemCF;
			let currentTotalCF = totalCount * itemCF;
			let diffCF = currentTotalCF - previousTotalCF;

			if (isCustomItem) {
				$scope.room.total_custom_cf += diffCF;
			} else {
				$scope.room.total_cf += diffCF;
			}
		}

		function updateRequestExtraService(changeValue) {
			if ($scope.item.extra_service != '0' && $scope.request) {
				let extraService = getExtraService();

				extraService.extra_services[1].services_default_value += changeValue;

				if (extraService.extra_services[1].services_default_value <= 0) {
					removeExtraService();
				}
			}
		}

		function updateItem() {
			if ($scope.item.totals.total_count == 0) {
				remove(getRemoveItemType());
			} else {
				let data = makeUpdateCountObject();
				saveItemCount(data);
			}
		}

		function makeUpdateCountObject() {
			let result = {
				id: $scope.item.type === 2 ? $scope.item.id : undefined,
				item_id: $scope.item.item_id,
				filter_id: $scope.filter.filter_id,
				room_id: $scope.room.room_id,
				name: $scope.item.name,
				count: $scope.item.totals.total_count,
				cf: $scope.item.cf,
				price: 0,
				entity_type: 0,
				type_inventory: $scope.inventoryType,
			};

			if ($scope.packageId) {
				result.package_id = $scope.packageId;
				result.entity_id = $scope.packageId;
			} else {
				result.entity_id = $scope.request.nid;
			}

			return result;
		}

		function saveItemCount(data) {
			if ($scope.item.totals.total_count > 0) {
				apiService.postData(updateItemUrl, {data}).then(res => {
					$scope.item.id = Number(res.data[0]);
				});
			}
		}

		function getRemoveItemType() {
			let result = 0;

			if ($scope.item.type == 1) {
				result = $scope.packageId ? 2 : 1;
			}

			return result;
		}

		function remove(type) {
			$scope.removeItem($scope.item);

			switch (type) {
				case 0:
					apiService.postData(moveBoardApi.inventory.request.removeCustomItem, {id: $scope.item.id});
					break;
				case 1:
					apiService.postData(moveBoardApi.inventory.request.removeItem, {id: $scope.item.id});
					break;
				case 2:
					apiService.postData(moveBoardApi.inventory.package.remove, {pac_rel_id: $scope.item.pac_rel_id});
					break;
			}
		}

		function getExtraService() {
			let result = _.find($scope.request.extraServices, {id: $scope.item.item_id});

			if (!result) {
				result = {
					id: $scope.item.item_id,
					name: $scope.item.extra_service_name || $scope.item.name,
					edit: false,
					entity_id: $scope.request.nid,
					extra_services: [
						{
							services_default_value: $scope.item.extra_service,
							services_name: "Cost",
							services_read_only: true,
							services_type: "Amount"
						},
						{
							services_default_value: 0,
							services_name: "Count",
							services_read_only: true,
							services_type: "Number"
						}
					]
				};

				$scope.request.extraServices.push(result);
			}

			return result;
		}

		function showAddButton() {
			$scope.showAdd = !$scope.item.totals || !$scope.item.totals.total_count || $scope.item.totals.total_count == 0;
			let isShowButtong = total == 0;
			$addButton.css('display', isShowButtong ? 'block' : 'none');
			$counterContent.css('display', isShowButtong ? 'none' : 'flex');
		}

		function removeExtraService() {
			$scope.request.extraServices = _.reject($scope.request.extraServices, {id: $scope.item.item_id});
		}

		function synchronizeItem(item) {
			let currentItem = _.find($scope.room.items, {item_id: item.item_id});

			if (currentItem) {
				currentItem.totals = item.totals;
			} else {
				$scope.room.items.push(item);
			}
		}
	}
}