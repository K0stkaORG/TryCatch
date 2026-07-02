import { OrbitControls } from "@react-three/drei";
import { Canvas } from "@react-three/fiber";
import { Rotate3D } from "lucide-react";
import { useMemo, useRef } from "react";
import * as THREE from "three";
import { Button } from "../ui/button";
import { TelemetryPanel } from "./TelemetryPanel";

type RocketModelProps = {
	roll: number;
	pitch: number;
	yaw: number;
};

const toRad = (value: number) => (value * Math.PI) / 180;

export const RocketModel = ({ roll, pitch, yaw }: RocketModelProps) => {
	// Reference to the orbit controls to trigger the reset
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const controlsRef = useRef<any>(null);

	const rotation = useMemo<[number, number, number]>(
		() => [toRad(pitch), toRad(yaw), toRad(roll)],
		[roll, pitch, yaw],
	);

	const bodyMaterial = useMemo(
		() => ({
			color: "#222222",
			metalness: 0.3,
			roughness: 0.5,
		}),
		[],
	);

	const noseMaterial = useMemo(
		() => ({
			color: "#222222",
			metalness: 0.4,
			roughness: 0.3,
		}),
		[],
	);

	const grayFinMaterial = useMemo(
		() => ({
			color: "#444444",
			metalness: 0.3,
			roughness: 0.4,
		}),
		[],
	);

	const pinkFinMaterial = useMemo(
		() => ({
			color: "#ff668f",
			metalness: 0.1,
			roughness: 0.6,
		}),
		[],
	);

	const blueFinMaterial = useMemo(
		() => ({
			color: "#66d8ff",
			metalness: 0.1,
			roughness: 0.6,
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

	// Handler to reset camera back to the initial setup
	const handleResetView = () => {
		if (controlsRef.current) {
			controlsRef.current.reset();
		}
	};

	return (
		<TelemetryPanel
			title="Orientation"
			action={
				<Button
					size="sm"
					className="gap-1.5 px-2 text-xs"
					onClick={handleResetView}
					variant="secondary">
					<Rotate3D className="size-3" />
					Reset View
				</Button>
			}>
			<div className="h-full overflow-hidden rounded-xl border">
				<div style={{ width: "100%", height: "100%", position: "relative" }}>
					<Canvas
						frameloop="always"
						camera={{ fov: 50, position: [0, 3.6, 9.45] }}
						dpr={[1, 1.5]}
						gl={{ antialias: false, powerPreference: "high-performance" }}>
						{/* OrbitControls enables mouse drag to orbit, scroll to zoom, and right-click to pan */}
						<OrbitControls
							ref={controlsRef}
							makeDefault
							enableDamping={true} // Makes the camera movement feel smooth
						/>

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
							{/* Rocket Body */}
							<mesh>
								<cylinderGeometry args={[0.45, 0.45, 4.0, 24, 1, false]} />
								<meshStandardMaterial {...bodyMaterial} />
							</mesh>

							{/* Nose Cone */}
							<mesh position={[0, 2.75, 0]}>
								<coneGeometry args={[0.45, 1.5, 24]} />
								<meshStandardMaterial {...noseMaterial} />
							</mesh>

							{/* Fins */}
							{[0, 1, 2, 3].map((i) => {
								let currentFinMaterial = grayFinMaterial;

								if (i === 0) {
									currentFinMaterial = pinkFinMaterial;
								} else if (i === 3) {
									currentFinMaterial = blueFinMaterial;
								}

								return (
									<group
										key={i}
										rotation={[0, (i * Math.PI) / 2, 0]}>
										<mesh position={[0.45, -2.0, -0.02]}>
											<extrudeGeometry args={[finShape, { depth: 0.04, bevelEnabled: false }]} />
											<meshStandardMaterial {...currentFinMaterial} />
										</mesh>
									</group>
								);
							})}

							{/* Local Solid Moving Arrows */}
							<primitive object={localXArrow} />
							<primitive object={localZArrow} />
						</group>
					</Canvas>
				</div>
			</div>
		</TelemetryPanel>
	);
};
