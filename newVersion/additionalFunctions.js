export function mainTotalCalc(rooms) {
	return {
		total_cf: calculateRoomsTotalCF(rooms) + getTotalCustomCf(rooms),
		count: calculateRoomsCount(rooms) + getTotalCustomCount(rooms),
		total_custom: getTotalCustomCount(rooms)
	}
}

function calculateRoomsTotalCF(rooms) {
	return rooms.filter(room => room.total_cf).map(room => Number(room.total_cf)).reduce((total_cf, sum) => total_cf + sum, 0);
}

function calculateRoomsCount(rooms) {
	return rooms.filter(room => room.total_count).map(room => Number(room.total_count)).reduce((total_count, sum) => total_count + sum, 0);
}

export function createCustomItems(rooms) {
	rooms.filter(room => !room.custom_items).forEach(room => room.custom_items = []);
}

export function getTotalCustomCount(rooms) {
	return rooms.filter(item => item.total_custom_count).map(item => Number(item.total_custom_count)).reduce((a, b) => a + b, 0);
}

export function getTotalCustomCf(rooms) {
	return rooms.filter(item => item.total_custom_cf).map(item => Number(item.total_custom_cf)).reduce((a, b) => a + b, 0);
}

export function getCustomItems(rooms) {
	return rooms.filter(item => item.custom_items && item.custom_items.length).map(item => item.custom_items).reduce((resArra, current) => resArra.concat(current), [])
}

export function converInventoryToOldVersion(inventory) {
	var result = [];
	inventory.forEach(item => {
		if (item.type !== 0 && item.totals) {
			result.push({
				id: Number(item.id),
				count: Number(item.totals.total_count),
				title: item.name,
				fid: item.filter_id,
				rid: item.room_id,
				cf: item.cf,
				photo: {
					name: item.name,
					fid: item.filter_id,
					path: item.image_link
				},
				cubicFeet: item.cf
			});
		}
	});
	return result;
}