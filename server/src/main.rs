use color_eyre::Result;
use poem::{get, handler, listener::TcpListener, web::Path, IntoResponse, Route, Server};
use simplelog::{Config, LevelFilter, SimpleLogger};

#[handler]
fn hello(Path(name): Path<String>) -> String {
	format!("hello: {}", name)
}

#[tokio::main]
async fn main() -> Result<()> {
	color_eyre::install()?;
	SimpleLogger::init(LevelFilter::Info, Config::default())?;

	let app = Route::new().at("/hello/:name", get(hello));
	Server::new(TcpListener::bind("127.0.0.1:3000"))
		.run(app)
		.await?;

	Ok(())
}
