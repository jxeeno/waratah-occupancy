# Waratah Occupancy API

Sydney Trains has recently made estimated passenger load information on its fleet of Waratah trains available to passengers.

Waratah trains have weight sensors installed on each carriage, which when coupled with the estimated weight of each passenger, can be used to provide an estimate of how busy the train is.

Some Transport for NSW endorsed apps [have per-carriage level information](https://transportnsw.info/news/2018/real-time-train-occupancy-display-comes-to-transport-apps) provided through another data feed that is not public (yet).  Sydney Trains and Transport for NSW plans to make per-carriage information available on Open Data through the existing GTFS-realtime data feeds.  Whilst this work is being done, you can still access train-level passenger estimates by grabbing the information from the Trip Planner APIs.

This script will generate a JSON file `occupancy.json` with each Waratah train's trip ID and their corresponding occupancy status.  The trip IDs should match the trip IDs found in the GTFS static and GTFS realtime feeds.

An example `occupancy.json` is provided in this repo.

## Quickstart

You will need Node.js installed.  Whilst the script was written and tested with Node.js v8.x, it may work on other versions too. YMMV.

```
git clone https://github.com/jxeeno/waratah-occupancy.git
cd waratah-git
npm i
TFNSW_API_KEY=<your Open Data API key> node waratahOccupancy.js
```