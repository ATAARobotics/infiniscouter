use std::sync::Arc;

use color_eyre::Result;
use poem::endpoint::StaticFilesEndpoint;
use poem::http::StatusCode;
use poem::middleware::{AddData, Compression};
use poem::web::{Data, Path};
use poem::{get, handler, listener::TcpListener, EndpointExt, Response, Route, Server};
use poem_openapi::OpenApiService;

use crate::api::Api;
use crate::config::ConfigManager;
use crate::database::{Database, ImageSize};
use crate::statbotics::StatboticsCache;
use crate::tba::Tba;

pub struct ScoutingServer {
	api: Api,
	tba: Arc<Tba>,
	config: ConfigManager,
	database: Arc<Database>,
}

#[handler]
async fn get_avatar(
	team: Path<u32>,
	tba: Data<&Arc<Tba>>,
	config: Data<&ConfigManager>,
) -> Response {
	match tba
		.get_avatar(*team, config.get_server_config().current_year)
		.await
	{
		Some(image) => Response::builder().content_type("image/png").body(image),
		None => poem::Response::from(StatusCode::NOT_FOUND),
	}
}

#[handler]
async fn get_image_full(image_id: Path<String>, database: Data<&Arc<Database>>) -> Response {
	match database.get_image(&image_id, ImageSize::Full).unwrap() {
		Some(image) => Response::builder()
			.content_type(image.mime_type)
			.body(image.image_data),
		None => poem::Response::from(StatusCode::NOT_FOUND),
	}
}

#[handler]
async fn get_image_small(image_id: Path<String>, database: Data<&Arc<Database>>) -> Response {
	match database.get_image(&image_id, ImageSize::Small).unwrap() {
		Some(image) => Response::builder()
			.content_type(image.mime_type)
			.body(image.image_data),
		None => poem::Response::from(StatusCode::NOT_FOUND),
	}
}

impl ScoutingServer {
	pub fn new(config: ConfigManager, database: Database) -> Result<Self> {
		let tba_auth_key = config.get_tba_auth_key().to_string();
		let game_config = config
			.get_game_config(config.get_server_config().current_year)
			.unwrap()
			.clone();
		let tba = Arc::new(Tba::new(game_config, tba_auth_key)?);
		let database = Arc::new(database);
		Ok(Self {
			api: Api::new(
				tba.clone(),
				StatboticsCache::new(
					&config.get_server_config().current_event,
					config.get_server_config().current_year,
					config
						.get_current_game_config()
						.game_config
						.statbotics
						.clone(),
				),
				config.clone(),
				database.clone(),
			),
			tba,
			config,
			database,
		})
	}
	/// Start serving connections on `addr`
	pub async fn serve(self, addr: &str) -> Result<()> {
		let api_service = OpenApiService::new(self.api, "Infiniscouter", "1.0")
			.description("The api that's used to communicate everything between the Infiniscouter server and the frontend.")
			.url_prefix("/api")
			.server("http://localhost:4421/");
		let swagger_ui = api_service.swagger_ui();
		let app = Route::new()
			// TODO: Use EmbeddedFilesEndpoint to embed these into the release binary.
			.nest(
				"/",
				StaticFilesEndpoint::new("../client/assets")
					.index_file("index.html")
					.fallback_to_index(),
			)
			.nest("/dist", StaticFilesEndpoint::new("../client/dist"))
			.nest("/api", api_service)
			.nest("/api/docs", swagger_ui)
			.at("/avatar/:team", get(get_avatar))
			.at("/image/full/:image_id", get(get_image_full))
			.at("/image/small/:image_id", get(get_image_small))
			.with(Compression::new())
			.with(AddData::new(self.tba.clone()))
			.with(AddData::new(self.config.clone()))
			.with(AddData::new(self.database.clone()));
		Server::new(TcpListener::bind(addr)).run(app).await?;
		Ok(())
	}
}
