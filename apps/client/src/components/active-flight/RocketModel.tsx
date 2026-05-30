import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";

type RocketModelProps = {
	roll: number;
	pitch: number;
	yaw: number;
};

const toRad = (value: number) => (value * Math.PI) / 180;

export const RocketModel = ({ roll, pitch, yaw }: RocketModelProps) => {
	const rotation = useMemo<[number, number, number]>(
		() => [toRad(pitch), toRad(yaw), toRad(roll)],
		[roll, pitch, yaw],
	);

	const bodyMaterial = useMemo(
		() => ({
			color: "#ff00a1",
			metalness: 0.2,
			roughness: 0.4,
		}),
		[],
	);

	const noseMaterial = useMemo(
		() => ({
			color: "#050505",
			metalness: 0.25,
			roughness: 0.28,
		}),
		[],
	);

	const finMaterial = useMemo(
		() => ({
			color: "#050505",
			metalness: 0.2,
			roughness: 0.45,
		}),
		[],
	);

	return (
		<Canvas
			frameloop="always"
			camera={{ fov: 50, position: [0, 0.8, 6] }}
			dpr={[1, 1.5]}
			gl={{ antialias: false, powerPreference: "high-performance" }}>
			<color
				attach="background"
				args={["#071329"]}
			/>
			<ambientLight intensity={0.95} />
			<directionalLight
				intensity={1.2}
				position={[4, 6, 8]}
			/>
			<directionalLight
				intensity={0.4}
				position={[-3, -1, -2]}
			/>
			<group rotation={rotation}>
				<mesh>
					<cylinderGeometry args={[0.45, 0.45, 2.8, 24, 1, false]} />
					<meshStandardMaterial {...bodyMaterial} />
				</mesh>

				<mesh position={[0, 1.9, 0]}>
					<coneGeometry args={[0.5, 1, 24]} />
					<meshStandardMaterial {...noseMaterial} />
				</mesh>

				<mesh position={[-0.5, -1.2, 0]}>
					<boxGeometry args={[0.6, 0.6, 0.1]} />
					<meshStandardMaterial {...finMaterial} />
				</mesh>

				<mesh position={[0.5, -1.2, 0]}>
					<boxGeometry args={[0.6, 0.6, 0.1]} />
					<meshStandardMaterial {...finMaterial} />
				</mesh>
			</group>
		</Canvas>
	);
};
