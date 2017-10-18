'use strict';
import './inventory.styl'
import '../aside/newAside.styl'
import {
	mainTotalCalc,
	createCustomItems,
	converInventoryToOldVersion,
	getCustomItems
} from './additionalFunctions.js'

const CUSTOM_ITEM_IMAGE_LINK = "/moveBoard/content/img/Large_Box_0.jpg";
const SEND_SEARCH_REQUEST__TIMEOUT = 300;

(() => {

	angular
		.module('newInventories')
		.directive('inventories', inventories);

	function inventories(apiService, moveBoardApi, PaymentServices, datacontext, RequestServices, config, $timeout, erDeviceDetector) {
		return {
			scope: {
				request: '=',
				packageId: '@',
				'listInventories': '=listinventories',
				saveListInventories: "=",
				inventoryType: '@',
				isAccount: '@'
			},
			template: require('./inventory.pug'),
			restrict: 'A',
			link: ($scope, element) => {
				let $itemsWrapper = angular.element('.js-items-wrapper');
				let $inventoryItems = angular.element('.js-inventory-items');
				let parent = angular.element(element).parent();
				//let calcSettings = angular.fromJson(datacontext.getFieldData().calcsettings);
				var inventorySettings = angular.fromJson(datacontext.getFieldData().inventorySetting);
				let scroollTimer, $itemsWraper;
				let updateItemTimeOut;

				$scope.busy = true;
				$scope.fullscreenMode = false;
				$scope.activeRoom = {};
				$scope.showMobileMenu = false;
				$scope.isAccount = IS_ACCOUNT;
				$scope.baseType = $scope.inventoryType; 
				$scope.menuMode = inventorySettings && inventorySettings.showItemsInFilter ? 0 : 1;
				$scope.customMode = false;
				$scope.newItem = {};
				$scope.is_iPad = navigator.userAgent.match(/iPad/i) != null;
				$scope.inventoryItems = [];
				$scope.isPackageSettings = $scope.packageId ? true : false;
				$scope.inventoryType = $scope.inventoryType || 0;
				$scope.isEmptyAdditionaInventory = ($scope.request.request_all_data.additional_inventory && _.isEmpty($scope.request.request_all_data.additional_inventory.length))
				$scope.total = {
					total_cf: 0,
					count: 0
				};
				$scope.myInventory = {
					count: '',
					opened: false
				};

				$scope.openMobileMenu = openMobileMenu;
				$scope.getMyInventory = getMyInventory;
				$scope.openRoom = openRoom;
				$scope.close = close;
				$scope.search = search;
				$scope.setFilter = setFilter;
				$scope.setCustomItemMode = setCustomItemMode;
				$scope.addCustomItem = addCustomItem;
				$scope.removeItem = removeItem;
				$scope.addTypicalItems = addTypicalItems;
				$scope.removeTypicalitems = removeTypicalitems;
				$scope.calcMyInventory = calcMyInventory;
				$scope.changeInventoryType = changeInventoryType;
				$scope.calculatePrint = calculatePrint;

				function init() {
					$itemsWraper = element.find('.js-items-wrapper');

					if ($scope.is_iPad) {
						$itemsWraper.on('scroll', () => {
							if (scroollTimer) {
								clearTimeout(scroollTimer);
							}
							scroollTimer = setTimeout(() => {
								scrollItems();
							}, 200)
						})
					} else {
						$itemsWraper.mCustomScrollbar({
							theme: "dark",
							callbacks: {
								onScroll: scrollItems
							}
						});
					}
					element.find(".js-custom-scrollbar").mCustomScrollbar({
						theme: "dark",
						callbacks: {
							onScroll: scrollItems
						}
					});
				}

				angular.element(document).bind('mouseup', function () {
					$scope.mouseClicked = false
				});

				angular.element(element).find('.js-selected-room').on('mousedown', () => {
					$scope.mouseClicked = true;
				});

				if ($scope.is_iPad) {
					let meta = angular.element('<meta name="viewport" content="width=device-width;  initial-scale=1; maximum-scale=1;minimum-scale=1;">');
					$('body').append(element);
					$('html').append(meta);
					$scope.fullscreenMode = true;
				}

				init();

				function openRoom(room) {
					if (room.opened) {
						return
					}

					$scope.activeRoom = room;
					$scope.searchResult = [];
					$scope.myInventory.opened = false;

					$scope.rooms.forEach(item => {
						item.opened = false;
					});

					if (room.filters && room.filters.length) {
						setFilter(room.filters[0]);
					}

					room.opened = true;
				}

				function close() {
					var elem = element;
					$scope.fullscreenMode = true;
					parent.append(elem);
				}

				function search() {
					$timeout.cancel(updateItemTimeOut);

					updateItemTimeOut = $timeout(() => {
						sendSearchRequest();
					}, SEND_SEARCH_REQUEST__TIMEOUT);

				}

				function sendSearchRequest() {
					if ($scope.searchText.length > 2) {
						$scope.busy = true;
						$scope.customMode = false;
						$scope.inventoryItems = [];
						let searchData = {
							"name":$scope.searchText,
							"conditions":{
								"entity_id":$scope.request.nid,
								"entity_type":"0"
							}
						};
						if ($scope.activeRoom || $scope.activeRoom.opened){
							searchData.conditions.room_id = $scope.activeRoom.room_id;
						}
						apiService.postData(moveBoardApi.inventory.request.search, searchData).then(res => {
							$scope.busy = false;

							if ($scope.searchText.length > 2) {
								$scope.inventoryItems = parseSearchResponse(res.data);
								calcMyInventory();
							}
						})
					} else if (_.isEmpty($scope.searchText.length) && !$scope.myInventory.opened && $scope.activeFilter) {
						setFilter($scope.activeFilter);
					} else if (_.isEmpty($scope.searchText.length) && $scope.myInventory.opened) {
						$scope.inventoryItems = $scope.myInventory.items;
					}
				}

				function parseSearchResponse(response) {
					let result = [];
					let roomIds = [];

					$scope.busy = false;

					response.sort((a, b) => a.room_id > b.room_id);

					response.forEach((item) => {
						let roomId = item.room_id;
						let room = _.find($scope.rooms, {room_id: item.room_id}) || {};

						if (!_.find(roomIds, id => id == roomId) && room.name) {
							result.push(getLabelItem(room.name));
							roomIds.push(roomId);
						}

						let filter = _.find(room.filters, {filter_id: item.filter_id}) || {};
						filter.items = filter.items || [];

						item = _.find(filter.items, {item_id: item.item_id}) || item;

						item.type = item.type == 0 ? 1 : 2;

						item.image_link = item.type == 1 ? item.image_link : CUSTOM_ITEM_IMAGE_LINK;
						item.room = room;
						item.filter = filter;
						result.push(item);
					});

					scrollItems();

					return result;
				}

				function setFilter(filter) {
					openMobileMenu();
					$scope.rooms.forEach(room => {
						if (room.filters) {
							room.filters.forEach(item => item.active = false)
						}
					});

					$scope.customMode = false;
					filter.active = true;
					$scope.activeFilter = filter;
					$scope.busy = true;
					$scope.searchResult = [];
					$scope.inventoryItems = [];

					if ($scope.activeFilter.loaded) {
						$scope.inventoryItems = $scope.activeFilter.items;
						$scope.busy = false;

						return true
					}

					apiService
						.postData(moveBoardApi.inventory.item.getItems, makeGetItemsData(filter))
						.then(res => {
							if ($scope.activeFilter === filter) {
								$scope.activeFilter.items = parseResult(res, false, $scope.menuMode);
								$scope.inventoryItems = $scope.activeFilter.items;
								$scope.activeFilter.loaded = true;
								calcMyInventory();
							}

							$scope.busy = false;
						});
				}

				function makeGetItemsData(filter) {
					return {
						entity_id: $scope.request && $scope.request.nid,
						entity_type: 0,
						with_filters: 1,
						type_inventory: $scope.inventoryType,
						conditions: {
							"filter_id": $scope.menuMode == 0 ? filter.filter_id : undefined,
							"room_id": $scope.activeRoom.room_id,
							"package_id": $scope.packageId || null
						}
					}
				}

				function openMobileMenu() {
					$scope.showMobileMenu = !$scope.showMobileMenu;
					element.find(".js-mobile-custom-scrollbar").mCustomScrollbar({
						theme: "dark",
						callbacks: {
							onScroll: scrollItems
						}
					});
				}

				function getMyInventory() {
					return new Promise((resolve, reject) => {
						if (!$scope.rooms) {
							reject();
						}

						$scope.busy = true;
						$scope.myInventory.opened = true;
						$scope.customMode = false;
						$scope.activeFilter = false;
						$scope.inventoryItems = [];
						$scope.rooms.forEach(item => {
							item.opened = false;
						});
						apiService.getData(moveBoardApi.inventory.room.index, {
							with_filters: 1,
							with_items_total: 1,
							package_id: $scope.packageId,
							type_inventory: $scope.inventoryType,
							entity_id: $scope.request ? $scope.request.nid : null,
							entity_type: 0
						}).then(res => {
							if ($scope.busy) {
								$scope.inventoryItems = parseResult(res, true, false);
								$scope.myInventory.items = $scope.inventoryItems;
								calcMyInventory();
								resolve(res.data);
							} else {
								reject();
							}
						})
					})
				}

				function findFilter(id, filters) {
					return filters.filter(item => item.filter_id == id)[0];
				}

				function findRoom(id) {
					return _.find($scope.rooms, {room_id: id}) || {};
				}

				function setCustomItemMode() {
					openMobileMenu();
					$scope.busy = true;
					$scope.customMode = true;
					$scope.activeFilter = false;
					$scope.inventoryItems = [];

					$scope.rooms.forEach(room => {
						if (room.filters) {
							room.filters.forEach(item => item.active = false)
						}
					});

					apiService.postData(moveBoardApi.inventory.request.getCustomItems, {
						entity_id: $scope.request.nid,
						entity_type: 0,
						conditions: {
							room_id: $scope.activeRoom.room_id
						}
					}).then(res => {
						$scope.busy = false;
						$scope.activeRoom.custom_items = res.data.map(item => {
							item.item_id = item.id;
							item.type = 2;
							item.image_link = CUSTOM_ITEM_IMAGE_LINK;
							item.extra_service = '0';
							item.visible = true;
							item.room = $scope.activeRoom;
							return item
						});

						$scope.inventoryItems = $scope.activeRoom.custom_items;
						scrollItems();
					})
				}

				function createCustomItem(customItem) {
					let data = {
						room_id: customItem.room.room_id,
						name: customItem.name,
						count: customItem.totals.total_count,
						cf: customItem.cf,
						price: 0,
						entity_id: $scope.request.nid,
						entity_type: 0,
						type: 1,
						image_link: customItem.image_link
					};

					apiService.postData(moveBoardApi.inventory.item.create, {data})
						.then(res => {
							let id = res.data[0];
							customItem.item_id = id;
							customItem.id = id;
						});
				}

				function addCustomItem(form) {
					if (form.$valid) {
						let item = makeNewCustomItem();
						$scope.activeRoom.total_custom_count = Number($scope.activeRoom.total_custom_count || 0) + item.totals.total_count;
						$scope.activeRoom.total_custom_cf = Number($scope.activeRoom.total_custom_cf || 0) + ( Number(item.cf) * Number(item.totals.total_count));

						$scope.inventoryItems.unshift(item);
						calcMyInventory();
						$scope.activeRoom.custom_items = $scope.inventoryItems;

						scrollItems();
						element.find(".js-items-wrapper").mCustomScrollbar("scrollTo", "top", {
							scrollInertia: 300
						});

						createCustomItem(item);

						setDefaultNewCustomItem(form);

						angular.element('#customInventoryName').focus();
					} else {
						form.$setDirty();
					}
				}

				function makeNewCustomItem() {
					let item = $scope.newItem;
					let cubicFeet = IS_ACCOUNT ? Number(item.width.value) * Number(item.height.value) * Number(item.depth.value) : item.pounds.value;

					return {
						cf: cubicFeet,
						extra_service: "0",
						handle_fee: "0",
						image_link: CUSTOM_ITEM_IMAGE_LINK,
						name: makeCustomItemName(item, cubicFeet),
						packing_fee: "0",
						price: "0",
						status: "0",
						type: "2",
						room: $scope.activeRoom,
						weight: "1",
						visible: false,
						totals: {
							total_count: Number(item.count.value)
						}
					}
				}

				function makeCustomItemName(item, cubicFeet) {
					let itemName = item.title.value;
					itemName += IS_ACCOUNT ? ` ${item.width.value}x${item.height.value}x${item.depth.value} ` : ` (${cubicFeet} c.f.)`;
					return itemName;
				}

				 function setDefaultNewCustomItem(form) {
					 $scope.newItem = {};
					  form.$setUntouched();
					  form.$setPristine(true);
				 }

				function removeItem(item) {
					if (!$scope.activeFilter) {
						let index = _.findIndex($scope.inventoryItems, {id: item.id});

						if (index != -1) {
							$scope.inventoryItems.splice(index, 1);
							let previousElementIsLabel = isLabelItem(index - 1);
							let currentElement = $scope.inventoryItems[index];
							let currentElementIsLabel = isLabelItem(index);

							if (previousElementIsLabel && (!currentElement || currentElementIsLabel)) {
								$scope.inventoryItems.splice(index - 1, 1);
							}
						}

						if (item.filter && item.filter.items) {
							item.filter.loaded = false;
						}
					}

					if (item.type == 2) {
						item.room.total_custom_count = Number(item.room.total_custom_count) - Number(item.totals.total_count);
						item.room.total_custom_cf = Number(item.room.total_custom_cf) - Number(item.cf) * Number(item.totals.total_count);
						calcMyInventory();
					}
				}

				function isLabelItem(index) {
					let item = $scope.inventoryItems[index];
					return item && item.type == 0
				}

				function addTypicalItems() {
					$scope.busy = true;
					apiService.postData(moveBoardApi.inventory.request.addPackageToRequest, {
						package_id: calcSettings.package[$scope.request.move_size.raw],
						entity_id: $scope.request.nid
					}).then(() => {
						$scope.busy = false;
						$scope.request.request_all_data.typicalItemsOn = true;
						RequestServices.saveReqData($scope.request.nid, $scope.request.request_all_data);
						init();
						$scope.init();
					})
				}

				function changeInventoryType (type) {
					$scope.busy = true;
					if ($scope.inventoryType == 0) {
						saveInventory();
					}

					$scope.inventoryType = type;
					$scope.init();
				}

				function removeTypicalitems() {
					$scope.busy = true;
					apiService.postData(moveBoardApi.inventory.request.removePackageFromRequest, {
						package_id: calcSettings.package[$scope.request.move_size.raw],
						entity_id: $scope.request.nid
					}).then(() => {
						$scope.busy = false;
						$scope.request.request_all_data.typicalItemsOn = false;
						RequestServices.saveReqData($scope.request.nid, $scope.request.request_all_data);
						init();
						$scope.init();
					})
				}

				function saveInventory(rooms) {
					if ($scope.request && $scope.inventoryType === 0) {
						apiService.postData(moveBoardApi.inventory.request.getItemsByType, {
							entity_id: $scope.request.nid,
							entity_type: 0,
							conditions: {
								type_inventory: [0,1]
							}
						}).then(res => {
							let list = converInventoryToOldVersion(res.data);
							console.log(list)
							$scope.saveListInventories(false, list);
						})
					}
				}

				function scrollItems(event) {
					var height = $itemsWrapper.height() + 100;
					var item = {};
					$inventoryItems.children().each(index => {
						item = $inventoryItems.children().eq(index);
						if ($scope.inventoryItems[item.attr('data-index')]) {
							$scope.inventoryItems[item.attr('data-index')].visible = item.offset().top - item.height() < height && item.offset().top > -(item.height() + 100);
						}
					})
				}

				function calcMyInventory() {
					$scope.rooms.forEach(item => item.count = ((Number(item.total_custom_count) || 0) + (Number(item.total_count) || 0)) || undefined);
					$scope.total = mainTotalCalc($scope.rooms);
					createCustomItems($scope.rooms);
				}

				function parseResult(res, withRooms, withFilters) {
					let result = [];
					$scope.busy = false;

					res.data.forEach(room => {
						if (withRooms && getItemsLength('filters')(room) > 0 || room.custom_items) {
							result.push(getLabelItem(room.name));
						}

						room.filters = room.filters || [];
						room.filters.forEach(filter => {
							if (withFilters && filter.items && filter.items.length > 0) {
								result.push(getLabelItem(filter.name));
							}
							filter.items = filter.items || [];
							filter.items.forEach(item => {
								item.type = 1;
								item.room = findRoom(room.room_id);
								item.filter = findFilter(filter.filter_id, item.room.filters);
								result.push(item);
							});
						});

						if (room.custom_items && !_.isEmpty(room.custom_items)) {
							if (withFilters) {
								result.push(getLabelItem('Custom items'));
							}

							room.custom_items.forEach(item => {
								item.type = 2;
								item.image_link = CUSTOM_ITEM_IMAGE_LINK;
								item.room = findRoom(room.room_id);
								result.push(item);
							});
						}

					});

					scrollItems();

					return result;
				}

				function getItemsLength(name) {
					return function (room) {
						return room[name] ? room[name].filter(item => item.items).map(item => item.items.length).reduce((a, b) => a + b, 0) : 0
					}
				}

				function getLabelItem(name, index) {
					return {filter_id: 1, name: name, type: 0, extra_service: '0'}
				}

				function calculatePrint() {
					$scope.printPages = splitInventoryByPrintPage($scope.rooms);
				}

				function splitInventoryByPrintPage(rooms) {
					let pages = [];
					let pagesClass = [];
					let pageIndex = 0;
					let itemCount = 0;
					let roomCount = 0;
					let itemOnPage = 110;

					function checkItemsAmountOnPage() {
						if (itemCount >= itemOnPage) {
							pagesClass[pageIndex] = getPrintPageColumns(itemCount);
							pageIndex++;
							itemCount = 0;
							roomCount = 0;
							let newRoom = {
								name: '',
								items: []
							};
							pages[pageIndex] = pages[pageIndex] || [];
							pages[pageIndex].push(newRoom);
						}
					}

					function addItemToPrintPage(item) {
						checkItemsAmountOnPage();
						itemCount++;
						pages[pageIndex][roomCount].items.push(item);
					}

					rooms.forEach(room => {
						let currentRoom = {
							name: room.name,
							items: []
						};

						pages[pageIndex] = pages[pageIndex] || [];
						pages[pageIndex].push(currentRoom);

						if (room.filters) {
							room.filters.forEach(filter => {
								if (filter.items) {
									filter.items.forEach(item => {
										addItemToPrintPage(item);
									})
								}
							})
						}
						if (room.custom_items) {
							room.custom_items.forEach(item => {
								addItemToPrintPage(item);
							});
						}
						roomCount++;
					});

					pagesClass[pageIndex] = pagesClass[pageIndex] ? pagesClass[pageIndex] : getPrintPageColumns(itemCount);

					return {
						pages: pages,
						pagesClass: pagesClass
					};
				}

				function getPrintPageColumns(items) {
					let printSize = calculatePrintColumnsSize(items);

					return `inventory-print__${printSize}-column-page`;
				}

				function calculatePrintColumnsSize(items) {
					let minItemOneColumn = 35;
					let maxItemTwoColumn = 70;
					let result = 'three';

					if (items < minItemOneColumn) {
						result = 'one';
					} else if (items >= minItemOneColumn && items < maxItemTwoColumn) {
						result = 'two';
					}

					return result;
				}

				function onDestroy() {
					getMyInventory().then(rooms => {
						
							saveInventory(rooms);
				
					})
				}

				$scope.$on('$destroy', onDestroy);
			},
			controller: controller
		};

		function controller($scope, erDeviceDetector, $window) {
			$scope.isMobile = erDeviceDetector.isMobile;
			$scope.roomsForList = {};
			$scope.inventoryItems = [];
			$scope.inventoryItemPlaceHolder = "<div> Loading Items! </div>";

			$scope.init = init;
			$scope.print = print;

			init();

			function init() {
				apiService.getData(moveBoardApi.inventory.room.index, {
					with_filters: 1,
					type_inventory: $scope.inventoryType,
					with_items_total: 1,
					package_id: $scope.packageId,
					entity_id: $scope.request ? $scope.request.nid : null,
					entity_type: 0
				}).then(res => {
					$scope.rooms = res.data;
					$scope.roomsForList.rooms = $scope.rooms;
					$scope.busy = false;
					$scope.calcMyInventory();

					if ($scope.total.count > 0) {
						$scope.getMyInventory();
					} else {
						$scope.openRoom($scope.rooms[0]);
					}
				})
			}

			function print() {
				new Promise((resolve, reject) => {
					$scope.showPrintInventory = true;
					$scope.calculatePrint();
					resolve();
				}).then(function () {
					$window.print();
				});


			}

			function afterPrint() {
				$scope.showPrintInventory = false;
				$scope.$apply();
			}

			if ($window.matchMedia) {
				let mediaQueryList = $window.matchMedia('print');
				mediaQueryList.addListener(function(mql) {
					if (!mql.matches) {
						afterPrint();
					}
				});
			}

			$window.onafterprint = afterPrint;
		}
	}
})();
