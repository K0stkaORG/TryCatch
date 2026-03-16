import { prompt } from "enquirer";
import { SerialPort } from "serialport";
import { ENV } from "~/env";
import { ExtendedError } from "./errors";
import { logger } from "./logger";

export class ESPPathPicker {
	private static _path: string | undefined;

	public static get path(): string {
		if (!ESPPathPicker._path)
			throw new ExtendedError("ESP path not set. Please call ESPPathPicker.pickPath() to set the path.");

		return ESPPathPicker._path;
	}

	public static async pickPath() {
		// List all available serial ports
		// Use enquirer to prompt the user to select the correct port for the ESP32
		// Set the selected path to ESPPathPicker.path

		const allPorts = await SerialPort.list();

		if (allPorts.length === 0)
			throw new ExtendedError("No serial ports found. Please connect the ESP32 and try again.");

		if (allPorts.length === 1) {
			ESPPathPicker._path = allPorts[0].path;
			logger.info("Only one serial port found. Automatically selected path: " + ESPPathPicker._path);
			return;
		}

		if (ENV.NODE_ENV === "development") {
			ESPPathPicker._path = allPorts[0].path;
			logger.warn(
				"Automatically selected the first available serial port for development environment: " +
					ESPPathPicker._path,
			);
			return;
		}

		const response = await prompt({
			type: "select",
			name: "path",
			message: "Please select the serial port for the ESP32:",
			choices: allPorts.map((port) => ({
				name: port.path,
				message: `${port.path} - ${port.manufacturer || "Unknown manufacturer"}`,
			})),
		});

		if (!("path" in response) || typeof response.path !== "string")
			throw new ExtendedError("No path selected. Please select a serial port for the ESP32.");

		ESPPathPicker._path = response.path;
		logger.info("Selected ESP32 serial port path: " + ESPPathPicker._path);
	}
}
