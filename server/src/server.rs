use crate::api::Api;
use crate::config::{ConfigManager, GameConfig};
use crate::database::Database;
use color_eyre::Result;
use poem::endpoint::StaticFilesEndpoint;
use poem::{listener::TcpListener, Route, Server};
use poem_openapi::OpenApiService;

pub struct ScoutingServer {
	api: Api,
}

impl ScoutingServer {
	pub fn new(config: ConfigManager, database: Database) -> Self {
		Self {
			api: Api::new(config, database),
		}
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
			.nest("/api/docs", swagger_ui);
		Server::new(TcpListener::bind(addr)).run(app).await?;
		Ok(())
	}
}
