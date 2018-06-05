const axios = require('axios');
const moment = require('moment');

const TFNSW_TP_DM_ENDPOINT = 'https://api.transport.nsw.gov.au/v1/tp/departure_mon';
const TFNSW_API_KEY = process.env.TFNSW_API_KEY;

const getFromStop = (divaStopId) => {
	let refMmt = moment().subtract(30, 'm'); // get departures from 30 mins ago

	return axios.get(TFNSW_TP_DM_ENDPOINT, {
		params: {
			TfNSWDM: true,
			depArrMacro: 'dep',
			depType: 'stopEvents',
			includedMeans: 'checkbox',
			inclMOT_1: '1', // only include trains
			includeCompleteStopSeq: 1,
			mode: 'direct',
			name_dm: divaStopId,
			outputFormat: 'rapidJSON',
			type_dm: 'stop',
			version: '10.2.2.48',
			limit: 100, // 100 is the max number of departures EFA returs

			itdDate: refMmt.format('YYYYMMDD'),
			itdTime: refMmt.format('HH:mm')
		},
		headers: {
			Authorization: `apikey ${TFNSW_API_KEY}`
		},
		json: true
	}).then(function (response) {
		(response.data.stopEvents || []).forEach(stopEvent => {
			let occupancy = null;

			let tripId = stopEvent.properties.RealtimeTripId || stopEvent.properties.AVMSTripID;


			// Trip Planner DM doesn't provide "current" occupancy
			// Instead, we'll find the stopEvent with the arrival/departure time closest to now

			// Joins the stop locations together to do some processing
			let sequentialLocations = [].concat(
				stopEvent.previousLocations || []
			).concat([Object.assign({
				departureTimeEstimated: stopEvent.departureTimeEstimated,
				departureTimePlanned: stopEvent.departureTimePlanned,
				arrivalTimeEstimated: stopEvent.arrivalTimeEstimated,
				arrivalTimePlanned: stopEvent.arrivalTimePlanned,
			}, stopEvent.location)]).concat(
				stopEvent.onwardLocations || []
			);
			let minTimeDiff = +Infinity;

			sequentialLocations.forEach(location => {
				// check there is an occupancy field
				if(location.properties && location.properties.occupancy){

					let stopOccupancy = location.properties.occupancy;
					let timeDiff = Math.abs(new Date(location.arrivalTimeEstimated || location.arrivalTimePlanned || location.departureTimeEstimated || location.departureTimePlanned) - now);

					// if the time difference is smaller than anything previously encountered, assign stopEvent occupancy to trip occupancy status
					if(timeDiff < minTimeDiff){
						occupancy = stopOccupancy;
						minTimeDiff = timeDiff;
					}
				}
			});

			// if we have occupancy data, assign it to the trip
			if(occupancy){
				trips[tripId] = occupancy;
			}
		});

		// let lastStopEvent = response.data.stopEvents[response.data.stopEvents.length-1];
		// let lastTime = new Date(lastStopEvent.arrivalTimeEstimated || lastStopEvent.arrivalTimePlanned || lastStopEvent.departureTimeEstimated || lastStopEvent.departureTimePlanned);
	})
	.catch(function (error) {
		console.error(error);
	});
};

let trips = {};
let now = new Date();

// Fetch DM from a bunch of locations around the network
let stopIds = [
	'10101100', // Central
	'10101117', // Chatswood
	'10101429', // Epping
	'10101127', // Hornsby
	'10101206', // Strathfield
	'10101401', // Bankstown
	'10101218', // Lidcombe
	'10101289', // Liverpool
	'10101291', // Glenfield
	'10101229', // Parramatta
];

const fs = require('fs');
Promise.all(stopIds.map(stopId => getFromStop(stopId))).then(() => {
	console.log(trips);
	fs.writeFileSync('occupancy.json', JSON.stringify(trips));
});