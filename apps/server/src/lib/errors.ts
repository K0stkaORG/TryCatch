export class UserRequestError extends Error {
	constructor(message: string) {
		super(message);
	}
}

export class ExtendedError extends Error {
	constructor(
		message: string,
		public readonly previous?: Error | unknown,
	) {
		super(message);
	}
}
