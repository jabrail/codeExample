'use strict';

import "./inventory-table.styl";

angular
	.module('newInventories')
	.directive('inventoryTable', inventoryTable);

inventoryTable.$inject = ['apiService', 'moveBoardApi'];

function inventoryTable(apiService, moveBoardApi) {
	inventoryListCtrl.$inject = ['$scope'];

	return {
		restrict: 'AE',
		template: require('./inventory-table.pug'),
		controller: inventoryListCtrl,
		scope: {
			initRooms: '=rooms',
			entityId: "=",
			columnWidth: "@"
		}
	};

	function inventoryListCtrl(scope) {
		init();

		function init() {
			let columnWidth = scope.columnWidth || 4;

			scope.roomClass = `col-md-${columnWidth}`;

			if (!scope.initRooms) {
				apiService.getData(moveBoardApi.inventory.room.index, {
					with_filters: 1,
					with_items_total: 1,
					entity_id: scope.entityId || null,
					entity_type: 0
				}).then(res => {
					scope.roomsHolder = {rooms: res.data};
				});
			} else {
				scope.roomsHolder = scope.initRooms;
			}
		}

		scope.emptyRooms = function (room) {
			return room.total_count;
		};

		scope.emptyItem = function (item) {
			return item.totals && item.totals.total_count;
		};
	}
}