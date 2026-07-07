export const MAX_CHART_POINTS = 48;

export const formatShortTime = (value: Date | string | number) =>
	new Date(value).toLocaleTimeString(["cs-CZ"], {
		hour: "2-digit",
		minute: "2-digit",
		second: "2-digit",
	});

export const formatAxisTime = (value: number) => ((value - Date.now()) / 1000).toFixed(1) + "s";

export const formatArchivedAxisTime = (flightStart: number) => (value: number) =>
	((value - flightStart) / 1000).toFixed(1) + "s";
