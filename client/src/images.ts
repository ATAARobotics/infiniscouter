/**
 * Uhhhh oh right this one just returns a new uuid v4
 */
function uuidv4(): string {
	return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
		const r = (Math.random() * 16) | 0,
			v = c === "x" ? r : (r & 0x3) | 0x8;
		return v.toString(16);
	});
}

/**
 * Make a da database uwu
 */
async function ensureDbPrepared(): Promise<IDBDatabase> {
	if (!(await navigator.storage.persist())) {
		alert("WARNING: Images might get deleted without persisted storage!");
	}
	return new Promise((resolve, reject) => {
		const request = window.indexedDB.open("Images");
		request.addEventListener("success", () => resolve(request.result));
		request.addEventListener("error", () => reject(request.error));
		request.addEventListener("upgradeneeded", () => {
			console.log("Upgrading/creating indexed db...");
			request.result.createObjectStore("images", { keyPath: "uuid" });
		});
	});
}

/**
 * Save an image to the database and like return a string or something I guess?
 */
export async function saveImage(file: File): Promise<string> {
	const db = await ensureDbPrepared();
	console.log("Database databased");
	const imageUuid = uuidv4();
	const data = await file.arrayBuffer();
	console.log("Data:");
	console.log(data);
	return await new Promise((resolve, reject) => {
		const trans = db
			.transaction("images", "readwrite")
			.objectStore("images")
			.put({ uuid: imageUuid, data: data });
		trans.addEventListener("success", () => {
			console.log("Image saved, uuid=" + imageUuid);
			resolve(imageUuid);
		});
		trans.addEventListener("error", () => {
			reject(trans.error);
		});
	});
}

/**
 * Get an image from the uuid thingie
 */
export async function getImage(uuid: string): Promise<ArrayBuffer | undefined> {
	const db = await ensureDbPrepared();
	return await new Promise((resolve, reject) => {
		const trans = db
			.transaction("images", "readonly")
			.objectStore("images")
			.get(uuid);
		trans.addEventListener("success", () => {
			resolve(trans.result.data);
		});
		trans.addEventListener("error", () => {
			reject(trans.error);
		});
	});
}
