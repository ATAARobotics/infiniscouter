
async function ensureDbPrepared() {
	if (await navigator.storage.persist()) {
		const db: IDBDatabase = await new Promise((resolve, reject) => {
			const request = window.indexedDB.open("Images");
			request.addEventListener("success", () => resolve(request.result));
			request.addEventListener("error", () => reject(request.error));
			request.addEventListener("upgradeneeded", () => {
				console.log("Upgrading/creating indexed db...");
			});
		});
		console.log("DB:");
		console.log(db);
	} else {
		alert("WARNING: Images might get deleted without persisted storage!");
	}
}

export function saveImage(file: File) {
	const thing = ensureDbPrepared();
}
