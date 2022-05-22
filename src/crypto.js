import crypto from 'node:crypto'

export function encrypter(message, secret) {
	const [key, iv] = secret.split(':')
	const encrypter = crypto.createCipheriv("aes-256-cbc", key, iv);
	let encryptedMsg = encrypter.update(message, "utf-8", "hex");
	encryptedMsg += encrypter.final("hex");
	return encryptedMsg
}

export function decrypter(encryptedMessage, secret) {
	const [key, iv] = secret.split(':')
	const decrypter = crypto.createDecipheriv("aes-256-cbc", key, iv);
	let decryptedMsg = decrypter.update(encryptedMessage, "hex", "utf8");
	decryptedMsg += decrypter.final("utf-8");
	return decryptedMsg
}

export function createRandomSecret() {
	return [crypto.randomBytes(32).toString("hex").slice(0, 32), crypto.randomBytes(16).toString("hex").slice(0, 16)].join(':');
}

