# J2Grows Database

A lightweight plant collection and sales database for J2Grows.

## Features

- Plant inventory with species, cultivar, status, cost, purchase date, source, location and notes
- Sales ledger with sale price, plant cost, buyer, channel and profit
- Dashboard with collection count, sales, revenue and profit
- Searchable plant and sales tables
- JSON backup and restore
- CSV exports for plants and sales
- Browser-local storage, so the app works without a server or account

## Usage

Open `index.html` in a browser or publish the repository with GitHub Pages.

> The current version stores data in the browser's local storage. Export a JSON backup regularly if the data matters. A future version can move the data layer to a hosted database/authentication service if multi-device or multi-user access is needed.
