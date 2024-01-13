#![feature(slice_group_by)]

mod analysis;
mod api;
mod config;
mod data_validation;
mod database;
mod server;
mod statbotics;
mod tba;

use crate::config::ConfigManager;
use crate::database::Database;
use crate::server::ScoutingServer;
use color_eyre::Result;
use log::info;
use simplelog::{Config, LevelFilter, SimpleLogger};

#[tokio::main]
async fn main() -> Result<()> {
	color_eyre::install()?;
	SimpleLogger::init(LevelFilter::Info, Config::default())?;

	let server = ScoutingServer::new(ConfigManager::new()?, Database::open("data")?)?;
	let address = "0.0.0.0:4421";
	info!("Starting server on '{address}'");
	server.serve(address).await
}
