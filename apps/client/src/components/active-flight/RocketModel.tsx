import { Canvas } from "@react-three/fiber";
import { useMemo } from "react";
import * as THREE from "three";

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
			color: "#111111",
			metalness: 0.3,
			roughness: 0.5,
		}),
		[],
	);

	const noseMaterial = useMemo(
		() => ({
			color: "#1a1a1a",
			metalness: 0.4,
			roughness: 0.3,
		}),
		[],
	);

	const finMaterial = useMemo(
		() => ({
			color: "#0d0d0d",
			metalness: 0.3,
			roughness: 0.4,
		}),
		[],
	);

	const finShape = useMemo(() => {
		const shape = new THREE.Shape();
		shape.moveTo(0, 0);
		shape.lineTo(0, 0.8);
		shape.lineTo(0.6, 0.4);
		shape.lineTo(0.5, 0);
		shape.lineTo(0, 0);
		return shape;
	}, []);

	// Moving (Local Space) Arrows attached to the rocket
	const localXArrow = useMemo(
		() => new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), new THREE.Vector3(0, 0, 0), 2.2, "#ff3366", 0.3, 0.15),
		[],
	);
	const localZArrow = useMemo(
		() => new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), new THREE.Vector3(0, 0, 0), 2.2, "#33ccff", 0.3, 0.15),
		[],
	);

	// Stationary (World Space) Reference Arrows customized with LineDashedMaterial
	const staticXArrow = useMemo(() => {
		const arrow = new THREE.ArrowHelper(
			new THREE.Vector3(1, 0, 0),
			new THREE.Vector3(0, 0, 0),
			3.2,
			"#ff3366",
			0.3,
			0.15,
		);
		arrow.line.material = new THREE.LineDashedMaterial({
			color: "#ff3366",
			dashSize: 0.15,
			gapSize: 0.1,
		});
		arrow.line.computeLineDistances();
		return arrow;
	}, []);

	const staticZArrow = useMemo(() => {
		const arrow = new THREE.ArrowHelper(
			new THREE.Vector3(0, 0, 1),
			new THREE.Vector3(0, 0, 0),
			3.2,
			"#33ccff",
			0.3,
			0.15,
		);
		arrow.line.material = new THREE.LineDashedMaterial({
			color: "#33ccff",
			dashSize: 0.15,
			gapSize: 0.1,
		});
		arrow.line.computeLineDistances();
		return arrow;
	}, []);

	return (
		<Canvas
			frameloop="always"
			// Scaled coordinates down by 10% from [0, 4.0, 10.5] to zoom in smoothly
			camera={{ fov: 50, position: [0, 3.6, 9.45] }}
			dpr={[1, 1.5]}
			gl={{ antialias: false, powerPreference: "high-performance" }}>
			{/* A smooth, lighter, muted pinkish background */}
			<color
				attach="background"
				args={["#26304D"]}
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

			{/* Stationary Dashed Reference Arrows */}
			<primitive object={staticXArrow} />
			<primitive object={staticZArrow} />

			{/* Rotating Rocket Group */}
			<group rotation={rotation}>
				{/* Rocket Body extended from 2.8 to 4.0 (spans from Y = -2.0 to Y = 2.0) */}
				<mesh>
					<cylinderGeometry args={[0.45, 0.45, 4.0, 24, 1, false]} />
					<meshStandardMaterial {...bodyMaterial} />
				</mesh>

				{/* Nose Cone shifted up to Y = 2.5 to stay flush with the elongated body */}
				<mesh position={[0, 2.5, 0]}>
					<coneGeometry args={[0.45, 1, 24]} />
					<meshStandardMaterial {...noseMaterial} />
				</mesh>

				{/* Fins shifted down to Y = -2.0 to stay flush with the elongated body base */}
				{[0, 1, 2, 3].map((i) => (
					<group
						key={i}
						rotation={[0, (i * Math.PI) / 2, 0]}>
						<mesh position={[0.45, -2.0, -0.02]}>
							<extrudeGeometry args={[finShape, { depth: 0.04, bevelEnabled: false }]} />
							<meshStandardMaterial {...finMaterial} />
						</mesh>
					</group>
				))}

				{/* Local Solid Moving Arrows */}
				<primitive object={localXArrow} />
				<primitive object={localZArrow} />
			</group>
		</Canvas>
	);
};
