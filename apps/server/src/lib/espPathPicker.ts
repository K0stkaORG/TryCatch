import { prompt } from "enquirer";
import { SerialPort } from "serialport";
import { ENV } from "~/env";
import { ExtendedError } from "./errors";
import { logger } from "./logger";

const DEV_ESP_PATH = "COM5";

export class ESPPathPicker {
	private static _path: string | undefined;

	public static get path(): string {
		if (!ESPPathPicker._path)
			throw new ExtendedError("ESP path not set. Please call ESPPathPicker.pickPath() to set the path.");

		return ESPPathPicker._path;
	}

	public static async pickPath() {
		const allPorts = await SerialPort.list();

		if (allPorts.length === 0)
			throw new ExtendedError("No serial ports found. Please connect the ESP32 and try again.");

		if (ENV.NODE_ENV === "development") {
			if (allPorts.some((port) => port.path === DEV_ESP_PATH)) {
				ESPPathPicker._path = DEV_ESP_PATH;
				logger.warn(`Running in dev environment, auto-selecting path: ${DEV_ESP_PATH}`);
			} else
				throw new ExtendedError(
					"DEV_ESP_PATH not found in serial ports. Please connect the ESP32 and try again.",
				);

			return;
		}

		if (allPorts.length === 1) {
			ESPPathPicker._path = allPorts[0].path;
			logger.info("Only one serial port found. Automatically selected path: " + ESPPathPicker._path);
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
