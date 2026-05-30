export class CircularBuffer<T> {
	public readonly capacity: number;
	public readonly buffer: T[];

	constructor(capacity: number, initialValue: T) {
		this.capacity = capacity;

		this.buffer = new Array(capacity).fill(initialValue);
	}

	public push(value: T) {
		for (let i = 0; i < this.capacity - 1; i++) {
			this.buffer[i] = this.buffer[i + 1];
		}

		this.buffer[this.capacity - 1] = value;
	}

	public get last() {
		return this.buffer[this.capacity - 1];
	}
}

export class CoarseCircularBuffer<T> extends CircularBuffer<T> {
	private counter = 0;
	private readonly precision: number;

	constructor(capacity: number, initialValue: T, precision = 10) {
		super(Math.ceil(capacity / precision), initialValue);

		this.precision = precision;
	}

	public push(value: T) {
		this.counter++;

		if (this.counter >= this.precision) {
			super.push(value);
			this.counter = 0;
		}
	}
}
