mod analysis;
mod api;
mod config;
mod data_validation;
mod database;
mod leaderboard;
mod server;
mod statbotics;
mod tba;

use std::time::Instant;

use color_eyre::Result;
use log::info;
use simplelog::{Config, LevelFilter, SimpleLogger};

use crate::config::ConfigManager;
use crate::database::Database;
use crate::server::ScoutingServer;

#[derive(Debug, Clone, PartialEq)]
pub struct DefaultInstant(Instant);

impl Default for DefaultInstant {
	fn default() -> Self {
		Self(Instant::now())
	}
}

#[tokio::main]
async fn main() -> Result<()> {
	color_eyre::install()?;
	SimpleLogger::init(LevelFilter::Info, Config::default())?;

	// Shutdown on SIGINT or SIGTERM, or CTRL-C, for docker
	#[cfg(not(target_os = "windows"))]
	tokio::spawn(async {
		use signal_hook::consts::{SIGINT, SIGTERM};
		use signal_hook::iterator::Signals;

		let mut signals = Signals::new([SIGINT, SIGTERM]).unwrap();
		if signals.forever().next().is_some() {
			info!("Shutting down due to SIGINT or SIGTERM");
			std::process::exit(0);
		}
	});

	let server = ScoutingServer::new(
		ConfigManager::new().unwrap(),
		Database::open("data").unwrap(),
	)
	.unwrap();
	let address = "0.0.0.0:4421";
	info!("Starting server on '{address}'");
	server.serve(address).await
}
