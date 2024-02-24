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
use crate::database::Database;
use crate::statbotics::StatboticsCache;
use crate::tba::Tba;

pub struct ScoutingServer {
	api: Api,
	tba: Arc<Tba>,
	config: ConfigManager,
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

impl ScoutingServer {
	pub fn new(config: ConfigManager, database: Database) -> Result<Self> {
		let tba_auth_key = config.get_tba_auth_key().to_string();
		let tba = Arc::new(Tba::new(tba_auth_key)?);
		Ok(Self {
			api: Api::new(
				tba.clone(),
				StatboticsCache::new(config.get_server_config().current_year),
				config.clone(),
				database,
			),
			tba,
			config,
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
			.with(Compression::new())
			.with(AddData::new(self.tba.clone()))
			.with(AddData::new(self.config.clone()));
		Server::new(TcpListener::bind(addr)).run(app).await?;
		Ok(())
	}
}
