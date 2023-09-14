use std::path::Path;

#[derive(Debug, Clone)]
pub struct Database {}

impl Database {
	pub fn open<P: AsRef<Path>>(_path: P) -> Database {
		Database {}
	}
}
