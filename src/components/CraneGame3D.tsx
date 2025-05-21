'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, PerspectiveCamera, Text, useGLTF } from '@react-three/drei';
import * as THREE from 'three';
import styles from '../styles/CraneGame3D.module.css';

// Define types for our prizes
interface Prize {
  id: number;
  name: string;
  modelPath: string;
  position: [number, number, number];
  scale: number;
  rotation: [number, number, number];
  caught?: boolean;
}

// Create a simple box model for the crane claw
const Claw = ({ position, isGrabbing }: { position: [number, number, number], isGrabbing: boolean }) => {
  const clawRef = useRef<THREE.Group>(null);
  
  // Scale the claw when grabbing
  useEffect(() => {
    if (clawRef.current) {
      if (isGrabbing) {
        clawRef.current.scale.set(0.9, 0.9, 0.9);
      } else {
        clawRef.current.scale.set(1, 1, 1);
      }
    }
  }, [isGrabbing]);
  
  return (
    <group ref={clawRef} position={position}>
      {/* Main claw body */}
      <mesh position={[0, 0, 0]}>
        <cylinderGeometry args={[0.3, 0.3, 0.5, 16]} />
        <meshStandardMaterial color="#555" />
      </mesh>
      
      {/* Claw arms */}
      <group rotation={[0, 0, 0]}>
        {/* Left arm */}
        <mesh position={[-0.3, -0.4, 0]} rotation={[0, 0, isGrabbing ? 0.5 : 0.2]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Right arm */}
        <mesh position={[0.3, -0.4, 0]} rotation={[0, 0, isGrabbing ? -0.5 : -0.2]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Front arm */}
        <mesh position={[0, -0.4, 0.3]} rotation={[isGrabbing ? 0.5 : 0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
        
        {/* Back arm */}
        <mesh position={[0, -0.4, -0.3]} rotation={[isGrabbing ? -0.5 : -0.2, 0, 0]}>
          <boxGeometry args={[0.1, 0.6, 0.1]} />
          <meshStandardMaterial color="#333" />
        </mesh>
      </group>
    </group>
  );
};

// Create a simple model for the crane arm
const CraneArm = ({ position, height }: { position: [number, number, number], height: number }) => {
  return (
    <group position={position}>
      {/* Vertical pole */}
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[0.2, height, 0.2]} />
        <meshStandardMaterial color="#777" />
      </mesh>
      
      {/* Horizontal support */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[8, 0.3, 0.3]} />
        <meshStandardMaterial color="#555" />
      </mesh>
    </group>
  );
};

// 3D Model Viewer component for the prize modal
const ModelViewer = ({ modelPath, prizeName }: { modelPath: string, prizeName: string }) => {
  const { scene } = useGLTF(modelPath);
  
  useEffect(() => {
    // Apply materials and setup for the model
    scene.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const mesh = child as THREE.Mesh;
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        
        // Enhance material properties for better color visibility
        if (mesh.material) {
          // Handle both single materials and material arrays
          const materials = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
          
          materials.forEach(mat => {
            // Safely cast and check if it's a standard material
            if (mat && mat.type.includes('Material')) {
              try {
                const material = mat as THREE.MeshStandardMaterial;
                
                // Apply basic properties that work for all material types
                if (material.roughness !== undefined) material.roughness = 0.5;
                if (material.metalness !== undefined) material.metalness = 0.3;
                
                // Only apply color adjustments if color exists
                if (material.color) {
                  // Model-specific material adjustments
                  if (prizeName === 'Hibiscus') {
                    // Preserve hibiscus colors
                    if (material.roughness !== undefined) material.roughness = 0.3;
                    if (material.metalness !== undefined) material.metalness = 0.1;
                    
                    // Safely add emissive if supported
                    if (material.emissive) {
                      const color = material.color.clone();
                      material.emissive = color.multiplyScalar(0.1);
                      if (material.emissiveIntensity !== undefined) {
                        material.emissiveIntensity = 0.2;
                      }
                    }
                  } else if (prizeName === 'Peach') {
                    // Peach-specific settings
                    if (material.roughness !== undefined) material.roughness = 0.7;
                    if (material.metalness !== undefined) material.metalness = 0.1;
                  } else {
                    // Settings for other models (trophy, bear, panther)
                    if (material.emissive) {
                      const color = material.color.clone();
                      material.emissive = color.multiplyScalar(0.2);
                      if (material.emissiveIntensity !== undefined) {
                        material.emissiveIntensity = 0.3;
                      }
                    }
                    if (material.roughness !== undefined) material.roughness = 0.5;
                    if (material.metalness !== undefined) material.metalness = 0.7;
                  }
                }
              } catch (e) {
                // Silently handle any errors with materials
                console.log('Material adjustment error:', e);
              }
            }
          });
        }
      }
    });
  }, [scene, prizeName]); // prizeName is included in the dependency array
  
  // Rotate the model
  useFrame(() => {
    scene.rotation.y += 0.01;
  });
  
  // Set scale based on prize name
  let scale = 3.0; // Default scale increased by 20%
  if (prizeName === 'GSU Panther') {
    scale = 5.4; // Increased by 20%
  } else if (prizeName === 'Trophy') {
    scale = 4.8; // Increased by 20%
  } else if (prizeName === 'Peach') {
    scale = 0.5; // Keep peach small
  } else if (prizeName === 'GGC Bear') {
    scale = 4.2; // Increased by 20%
  } else if (prizeName === 'Hibiscus') {
    scale = 2.0; // Increased by ~20%
  }
  
  // Adjust position based on prize name for better centering
  let position: [number, number, number] = [0, 0, 0];
  if (prizeName === 'GSU Panther') {
    position = [0, -1, 0];
  } else if (prizeName === 'Trophy') {
    position = [0, -1.5, 0];
  } else if (prizeName === 'GGC Bear') {
    position = [0, -0.5, 0];
  }
  
  return <primitive object={scene} scale={scale} position={position} />;
};

// Create a gift-wrapped present for each prize
const PrizeModel = ({ prize, onClick }: { prize: Prize, onClick?: () => void }) => {
  const groupRef = useRef<THREE.Group>(null);
  
  // Simple animation for the prizes
  useFrame(() => {
    if (groupRef.current) {
      groupRef.current.rotation.y += 0.005;
    }
  });
  
  // Generate colors based on the prize id
  const boxColors = ["#FF6B6B", "#4ECDC4", "#FFD166", "#06D6A0", "#118AB2"];
  const ribbonColors = ["#FF1493", "#FFD700", "#FF4500", "#9400D3", "#32CD32"];
  
  const boxColor = boxColors[prize.id % boxColors.length];
  const ribbonColor = ribbonColors[prize.id % ribbonColors.length];
  
  return (
    <group 
      ref={groupRef}
      position={prize.position}
      rotation={prize.rotation}
      scale={[prize.scale, prize.scale, prize.scale]}
      onClick={onClick}
    >
      {/* Main gift box */}
      <mesh>
        <boxGeometry args={[1, 1, 1]} />
        <meshStandardMaterial color={boxColor} />
      </mesh>
      
      {/* Vertical ribbon */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[0.1, 1.05, 1.05]} />
        <meshStandardMaterial color={ribbonColor} />
      </mesh>
      
      {/* Horizontal ribbon */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.05, 0.1, 1.05]} />
        <meshStandardMaterial color={ribbonColor} />
      </mesh>
      
      {/* Ribbon bow on top */}
      <group position={[0, 0.55, 0]}>
        {/* Bow center */}
        <mesh>
          <sphereGeometry args={[0.12, 8, 8]} />
          <meshStandardMaterial color={ribbonColor} />
        </mesh>
        
        {/* Bow loops */}
        <mesh position={[0.15, 0, 0]} rotation={[0, 0, Math.PI / 4]}>
          <torusGeometry args={[0.12, 0.04, 8, 16, Math.PI]} />
          <meshStandardMaterial color={ribbonColor} />
        </mesh>
        
        <mesh position={[-0.15, 0, 0]} rotation={[0, 0, -Math.PI / 4]}>
          <torusGeometry args={[0.12, 0.04, 8, 16, Math.PI]} />
          <meshStandardMaterial color={ribbonColor} />
        </mesh>
        
        {/* Ribbon ends */}
        <mesh position={[0.2, -0.1, 0]} rotation={[0, 0, Math.PI / 6]}>
          <boxGeometry args={[0.25, 0.06, 0.06]} />
          <meshStandardMaterial color={ribbonColor} />
        </mesh>
        
        <mesh position={[-0.2, -0.1, 0]} rotation={[0, 0, -Math.PI / 6]}>
          <boxGeometry args={[0.25, 0.06, 0.06]} />
          <meshStandardMaterial color={ribbonColor} />
        </mesh>
      </group>
    </group>
  );
};

// Arcade floor tiles component
const ArcadeFloor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -5, 0]} receiveShadow>
      <planeGeometry args={[50, 50]} />
      <meshStandardMaterial>
        <meshPhongMaterial color="#333" shininess={90}>
          <meshBasicMaterial color="#111" />
        </meshPhongMaterial>
      </meshStandardMaterial>
    </mesh>
  );
};

// Arcade floor checkerboard pattern
const ArcadeFloorPattern = () => {
  const tiles = [];
  const tileSize = 2;
  const gridSize = 12;
  
  for (let x = -gridSize/2; x < gridSize/2; x++) {
    for (let z = -gridSize/2; z < gridSize/2; z++) {
      const isEven = (x + z) % 2 === 0;
      tiles.push(
        <mesh 
          key={`tile-${x}-${z}`} 
          position={[x * tileSize, -4.99, z * tileSize]} 
          rotation={[-Math.PI / 2, 0, 0]}
          receiveShadow
        >
          <planeGeometry args={[tileSize, tileSize]} />
          <meshStandardMaterial color={isEven ? '#111' : '#333'} />
        </mesh>
      );
    }
  }
  
  return <group>{tiles}</group>;
};

// Arcade wall component with neon lights
const ArcadeWall = ({ position, rotation, color }: { position: [number, number, number], rotation: [number, number, number], color: string }) => {
  return (
    <group position={position} rotation={rotation}>
      {/* Main wall */}
      <mesh receiveShadow>
        <boxGeometry args={[30, 15, 0.5]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      
      {/* Neon light trim */}
      <mesh position={[0, 7, 0.3]}>
        <boxGeometry args={[28, 0.3, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      
      <mesh position={[0, -7, 0.3]}>
        <boxGeometry args={[28, 0.3, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      
      <mesh position={[14, 0, 0.3]}>
        <boxGeometry args={[0.3, 14, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
      
      <mesh position={[-14, 0, 0.3]}>
        <boxGeometry args={[0.3, 14, 0.2]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
      </mesh>
    </group>
  );
};

// Arcade ceiling with lights
const ArcadeCeiling = () => {
  return (
    <group position={[0, 10, 0]}>
      {/* Ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[50, 50]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      
      {/* Ceiling lights */}
      {[-15, -5, 5, 15].map((x, i) => (
        <group key={`ceiling-light-${i}`} position={[x, 0, 0]}>
          <pointLight position={[0, -0.5, 0]} intensity={0.5} color="#ffffff" distance={15} />
          <mesh position={[0, -0.2, 0]}>
            <boxGeometry args={[2, 0.2, 2]} />
            <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={0.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Other arcade machines in background
const ArcadeMachine = ({ position, color }: { position: [number, number, number], color: string }) => {
  return (
    <group position={position}>
      {/* Cabinet */}
      <mesh position={[0, 0, 0]} castShadow>
        <boxGeometry args={[2.5, 4, 2]} />
        <meshStandardMaterial color={color} />
      </mesh>
      
      {/* Screen */}
      <mesh position={[0, 1, 1.1]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2, 1.5]} />
        <meshStandardMaterial color="#000" emissive="#333" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Controls */}
      <mesh position={[0, -0.5, 1.1]}>
        <boxGeometry args={[2, 1, 0.2]} />
        <meshStandardMaterial color="#111" />
      </mesh>
      
      {/* Joystick */}
      <mesh position={[-0.5, -0.5, 1.3]}>
        <sphereGeometry args={[0.2]} />
        <meshStandardMaterial color="#ff0000" />
      </mesh>
      
      {/* Buttons */}
      {[0.2, 0.6, 1].map((x, i) => (
        <mesh key={`button-${i}`} position={[x, -0.5, 1.3]}>
          <cylinderGeometry args={[0.1, 0.1, 0.1]} />
          <meshStandardMaterial color={i === 0 ? "#00ff00" : i === 1 ? "#0000ff" : "#ffff00"} />
        </mesh>
      ))}
    </group>
  );
};

// Create the game container
const CraneMachine = ({ 
  prizes, 
  cranePosition, 
  clawPosition, 
  isGrabbing, 
  caughtPrize,
  // isPrizeDropping,
  droppedPrizePosition,
  droppedPrizeRotation,
  droppedPrizeColor,
  droppedPrizeScale,
  isAnimatingPrize,
  droppedPrizes
}: { 
  prizes: Prize[], 
  cranePosition: [number, number, number], 
  clawPosition: [number, number, number], 
  isGrabbing: boolean, 
  caughtPrize: Prize | null,
  // isPrizeDropping: boolean, // Prop is kept for interface compatibility
  droppedPrizePosition: [number, number, number],
  droppedPrizeRotation: [number, number, number],
  droppedPrizeColor: string,
  droppedPrizeScale: [number, number, number],
  isAnimatingPrize: boolean,
  droppedPrizes: Array<{
    position: [number, number, number];
    rotation: [number, number, number];
    color: string;
    scale: [number, number, number];
  }>
}) => {
  return (
    <group>
      {/* Game container */}
      <mesh position={[0, -1, 0]} receiveShadow>
        <boxGeometry args={[10, 0.5, 10]} />
        <meshStandardMaterial color="#1E1E1E" />
      </mesh>
      
      {/* Glass walls */}
      <mesh position={[0, 2, -5]} receiveShadow>
        <boxGeometry args={[10, 6, 0.1]} />
        <meshStandardMaterial color="#88CCFF" transparent opacity={0.2} />
      </mesh>
      
      <mesh position={[0, 2, 5]} receiveShadow>
        <boxGeometry args={[10, 6, 0.1]} />
        <meshStandardMaterial color="#88CCFF" transparent opacity={0.2} />
      </mesh>
      
      <mesh position={[-5, 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, 6, 10]} />
        <meshStandardMaterial color="#88CCFF" transparent opacity={0.2} />
      </mesh>
      
      <mesh position={[5, 2, 0]} receiveShadow>
        <boxGeometry args={[0.1, 6, 10]} />
        <meshStandardMaterial color="#88CCFF" transparent opacity={0.2} />
      </mesh>
      
      {/* Floor */}
      <mesh position={[0, -0.7, 0]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[9.5, 9.5]} />
        <meshStandardMaterial color="#DDDDDD" />
      </mesh>
      
      {/* Crane arm */}
      <CraneArm position={[cranePosition[0], 5, cranePosition[2]]} height={10} />
      
      {/* Claw */}
      <Claw position={clawPosition} isGrabbing={isGrabbing} />
      
      {/* Prizes */}
      {prizes.map(prize => !prize.caught && (
        <PrizeModel key={prize.id} prize={prize} />
      ))}
      
      {/* Caught prize - it moves with the claw */}
      {caughtPrize && (
        <PrizeModel 
          prize={{
            ...caughtPrize,
            position: [
              clawPosition[0], 
              clawPosition[1] - 1, 
              clawPosition[2]
            ]
          }} 
        />
      )}
      
      {/* Currently dropping prize - animated falling to the ground */}
      {isAnimatingPrize && (
        <group
          position={droppedPrizePosition}
          rotation={droppedPrizeRotation}
          scale={droppedPrizeScale}
        >
          {/* Main gift box */}
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={droppedPrizeColor} />
          </mesh>
          
          {/* Vertical ribbon */}
          <mesh>
            <boxGeometry args={[0.1, 1.05, 1.05]} />
            <meshStandardMaterial color={"#FF1493"} />
          </mesh>
          
          {/* Horizontal ribbon */}
          <mesh>
            <boxGeometry args={[1.05, 0.1, 1.05]} />
            <meshStandardMaterial color={"#FF1493"} />
          </mesh>
        </group>
      )}
      
      {/* Previously dropped prizes that are now at rest */}
      {droppedPrizes.map((prize, index) => (
        <group
          key={`dropped-${index}`}
          position={prize.position}
          rotation={prize.rotation}
          scale={prize.scale}
        >
          {/* Main gift box */}
          <mesh>
            <boxGeometry args={[1, 1, 1]} />
            <meshStandardMaterial color={prize.color} />
          </mesh>
          
          {/* Vertical ribbon */}
          <mesh>
            <boxGeometry args={[0.1, 1.05, 1.05]} />
            <meshStandardMaterial color={"#FF1493"} />
          </mesh>
          
          {/* Horizontal ribbon */}
          <mesh>
            <boxGeometry args={[1.05, 0.1, 1.05]} />
            <meshStandardMaterial color={"#FF1493"} />
          </mesh>
        </group>
      ))}
    </group>
  );
};

// Create a component to display won prizes
const WonPrizes = ({ prizes }: { prizes: Prize[] }) => {
  return (
    <group position={[0, 0, 10]}>
      <Text
        position={[0, 5, 0]}
        color="black"
        fontSize={0.5}
        font="/fonts/Inter-Bold.woff"
        anchorX="center"
      >
        Your Prizes
      </Text>
      
      {/* Use only prize.id as the key to prevent duplicates */}
      {prizes.map((prize, index) => (
        <group key={`won-${prize.id}`} position={[(index - prizes.length / 2 + 0.5) * 2, 3, 0]}>
          <PrizeModel 
            prize={{
              ...prize,
              position: [0, 0, 0],
              scale: 0.5
            }} 
          />
          <Text
            position={[0, -1, 0]}
            color="black"
            fontSize={0.3}
            font="/fonts/Inter-Regular.woff"
            anchorX="center"
          >
            {prize.name}
          </Text>
        </group>
      ))}
      
      {prizes.length === 0 && (
        <Text
          position={[0, 3, 0]}
          color="black"
          fontSize={0.3}
          font="/fonts/Inter-Regular.woff"
          anchorX="center"
        >
          No prizes yet. Try your luck!
        </Text>
      )}
    </group>
  );
};

// Main game component
const CraneGame3D = () => {
  const [cranePosition, setCranePosition] = useState<[number, number, number]>([0, 5, 0]);
  const [clawPosition, setClawPosition] = useState<[number, number, number]>([0, 4, 0]);
  const [isLowering, setIsLowering] = useState(false);
  const [isGrabbing, setIsGrabbing] = useState(false);
  const [isRaising, setIsRaising] = useState(false);
  const [isReturning, setIsReturning] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [gameMessage, setGameMessage] = useState('Use A/D or Left/Right to move the crane, W/S or Up/Down to move forward/backward, Space to lower the claw!');  
  const dropChance = 0.7; // 70% chance to drop the prize - more realistic for crane games
  // State for modal and prize display
  const [showWinModal, setShowWinModal] = useState(false);
  const [lastWonPrize, setLastWonPrize] = useState<Prize | null>(null);
  const [showAllPrizesWonModal, setShowAllPrizesWonModal] = useState(false);
  const [confetti, setConfetti] = useState<Array<{id: number, color: string, left: string, delay: string}>>([]);
  // No longer needed since we removed prize dropping
  const [caughtPrize, setCaughtPrize] = useState<Prize | null>(null);
  const [prizes, setPrizes] = useState<Prize[]>([
    { id: 1, name: 'GGC Bear', modelPath: '/models/bear.glb', position: [-2, -0.2, -2], scale: 0.8, rotation: [0, 0, 0] },
    { id: 2, name: 'GSU Panther', modelPath: '/models/panther.glb', position: [0, -0.2, 0], scale: 0.8, rotation: [0, 0, 0] },
    { id: 3, name: 'Hibiscus', modelPath: '/models/hibiscus.glb', position: [2, -0.2, 2], scale: 0.8, rotation: [0, 0, 0] },
    { id: 4, name: 'Trophy', modelPath: '/models/trophy.glb', position: [-2, -0.2, 2], scale: 0.8, rotation: [0, 0, 0] },
    { id: 5, name: 'Peach', modelPath: '/models/peach.glb', position: [2, -0.2, -2], scale: 0.8, rotation: [0, 0, 0] }
  ]);
  const [wonPrizes, setWonPrizes] = useState<Prize[]>([]);   
  const [movementEnabled, setMovementEnabled] = useState(true);
  
  // Handle keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!movementEnabled) return;
      
      switch (e.key) {
        case 'ArrowLeft':
        case 'a':
        case 'A':
          setCranePosition(prev => [Math.max(prev[0] - 0.5, -4), prev[1], prev[2]]);
          break;
        case 'ArrowRight':
        case 'd':
        case 'D':
          setCranePosition(prev => [Math.min(prev[0] + 0.5, 4), prev[1], prev[2]]);
          break;
        case 'ArrowUp':
        case 'w':
        case 'W':
          setCranePosition(prev => [prev[0], prev[1], Math.max(prev[2] - 0.5, -4)]);
          break;
        case 'ArrowDown':
        case 's':
        case 'S':
          setCranePosition(prev => [prev[0], prev[1], Math.min(prev[2] + 0.5, 4)]);
          break;
        case ' ':
          if (!isLowering && !isGrabbing && !isRaising && !isReturning) {
            setIsLowering(true);
            setMovementEnabled(false);
            setGameMessage('Lowering the claw...');
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLowering, isGrabbing, isRaising, isReturning, movementEnabled]);

  // Update claw position to follow crane
  useEffect(() => {
    if (!isLowering && !isGrabbing && !isRaising && !isReturning) {
      setClawPosition([cranePosition[0], 4, cranePosition[2]]);
    }
  }, [cranePosition, isLowering, isGrabbing, isRaising, isReturning]);

  // Handle claw animation
  useEffect(() => {
    let animationFrame: number;
    
    const animateClaw = () => {
      if (isLowering) {
        setClawPosition(prev => {
          const newY = prev[1] - 0.1;
          if (newY <= 0) {
            setIsLowering(false);
            setIsGrabbing(true);
            setGameMessage('Grabbing...');
            return [prev[0], 0, prev[2]];
          }
          return [prev[0], newY, prev[2]];
        });
      } else if (isGrabbing) {
        // Check if we caught a prize
        const potentialPrize = prizes.find(prize => 
          !prize.caught &&
          Math.abs(clawPosition[0] - prize.position[0]) < 1 &&
          Math.abs(clawPosition[2] - prize.position[2]) < 1
        );
        
        // 60% chance of successfully grabbing if positioned correctly
        const grabSuccess = potentialPrize && Math.random() < 0.6;
        
        if (grabSuccess) {
          setCaughtPrize(potentialPrize);
          setPrizes(prev => prev.map(p => 
            p.id === potentialPrize.id ? { ...p, caught: true } : p
          ));
          setGameMessage(`Caught a ${potentialPrize.name}!`);
        } else {
          setGameMessage('Nothing caught. Try again!');
        }
        
        setTimeout(() => {
          setIsGrabbing(false);
          setIsRaising(true);
        }, 1000);
      } else if (isRaising) {
        // No prize dropping during raising - once caught, the prize stays caught
        if (caughtPrize) {
          setGameMessage(`Raising the ${caughtPrize.name}! Success!`);
        }
        
        // Continue raising the claw
        setClawPosition(prev => {
          const newY = prev[1] + 0.1;
          if (newY >= 4) {
            setIsRaising(false);
            setIsReturning(true);
            return [prev[0], 4, prev[2]];
          }
          return [prev[0], newY, prev[2]];
        });
      } else if (isReturning) {
        setClawPosition(prev => {
          const targetX = 0;
          const targetZ = 0;
          const dx = (targetX - prev[0]) * 0.1;
          const dz = (targetZ - prev[2]) * 0.1;
          const newX = prev[0] + dx;
          const newZ = prev[2] + dz;
          
          if (Math.abs(newX - targetX) < 0.1 && Math.abs(newZ - targetZ) < 0.1) {
            setIsReturning(false);
            setCranePosition([0, 5, 0]);
            setMovementEnabled(true);
            
            if (caughtPrize) {
              // Add to won prizes only if not already won (prevent duplicates)
              setWonPrizes(prev => {
                // Check if this prize ID already exists in the won prizes array
                const alreadyWon = prev.some(p => p.id === caughtPrize.id);
                if (alreadyWon) {
                  return prev; // Don't add duplicates
                }
                return [...prev, caughtPrize];
              });
              setLastWonPrize(caughtPrize);
              setShowWinModal(true);
              
              // Generate confetti
              const newConfetti = [];
              for (let i = 0; i < 50; i++) {
                newConfetti.push({
                  id: i,
                  color: ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'][Math.floor(Math.random() * 6)],
                  left: `${Math.random() * 100}%`,
                  delay: `${Math.random() * 3}s`
                });
              }
              setConfetti(newConfetti);
              
              setCaughtPrize(null);
              setGameMessage('You won a prize! Try again?');
            } else {
              setGameMessage('Move the crane and try again!');
            }
            
            return [0, 4, 0];
          }
          
          return [newX, prev[1], newZ];
        });
      }
      
      // Prize dropping animation removed
      
      animationFrame = requestAnimationFrame(animateClaw);
    };
    
    animationFrame = requestAnimationFrame(animateClaw);
    return () => cancelAnimationFrame(animationFrame);
  }, [isLowering, isGrabbing, isRaising, isReturning, prizes, clawPosition, caughtPrize, dropChance]);

  // Prize descriptions for the modal
  const prizeDescriptions = {
    'GGC Bear': 'The Bear is the mascot for GGC where Bree Day recieved a BS in Information Technology.',
    'GSU Panther': 'Bree Day recieved a BS in Psychology from GSU. GSU\'s mascot is the Panther.',
    'Hibiscus': 'The Hibiscus is the state flower of Hawaii where Bree Day has been working as a freelance developer.',
    'Trophy': 'Similar to the awards Bree Day recieved from the many hackathons (Hosted by Google, AWS, and more) where she competed and won.',
    'Peach': 'Represents Georgia where Bree Day has worked as a developer with companies like SMI inc.'
  };
  
  // Function to close the modal
  const handleCloseModal = () => {
    setShowWinModal(false);
    
    // Check if all prizes have been won
    if (wonPrizes.length === prizes.length && !showAllPrizesWonModal) {
      setShowAllPrizesWonModal(true);
    } else {
      setGameMessage('Use arrow keys to move the crane and space to grab!');
    }
  };
  
  // Handle visiting Bree's profile
  const handleVisitProfile = () => {
    window.open('https://www.breeday.com', '_blank');
  };
  
  // Handle closing the all prizes won modal
  const handleCloseAllPrizesModal = () => {
    setShowAllPrizesWonModal(false);
    setGameMessage('Use arrow keys to move the crane and space to grab!');
  };

  return (
    <div className={styles.gameContainer}>
      <div className={styles.gameHeader}>
        <h1 className={styles.arcadeTitle}>Bree Day&apos;s Resume Crane</h1>
        <p className={styles.gameMessage}>{gameMessage}</p>
        <div className={styles.controls}>
          <p>Controls: A/D or Left/Right to move left/right, W/S or Up/Down to move forward/backward, Space to lower claw</p>
          <div className={styles.viewControls}>
            <button 
              className={`${styles.viewButton} ${autoRotate ? styles.active : ''}`}
              onClick={() => setAutoRotate(!autoRotate)}
            >
              {autoRotate ? 'Stop Rotation' : 'Auto-Rotate View'}
            </button>
            <p className={styles.viewTip}>Tip: Drag with mouse to rotate view, scroll to zoom in/out</p>
          </div>
        </div>
      </div>
      
      {/* Prize Win Modal */}
      <div className={`${styles.modalOverlay} ${showWinModal ? styles.visible : ''}`}>
        {confetti.map(item => (
          <div 
            key={item.id}
            className={styles.confetti}
            style={{
              backgroundColor: item.color,
              left: item.left,
              animationDelay: item.delay
            }}
          />
        ))}
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>🎉 You Won! 🎉</h2>
          </div>
          
          {lastWonPrize && (
            <>
              <div className={styles.prizeImage}>
                <div style={{ 
                  width: '100%', 
                  height: '100%', 
                  position: 'relative',
                  transform: 'scale(1.45)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center'
                }}>
                  <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
                    <ambientLight intensity={1.5} />
                    <pointLight position={[10, 10, 10]} intensity={1.5} />
                    <pointLight position={[-10, -10, -10]} intensity={1} />
                    <directionalLight position={[0, 5, 5]} intensity={1.2} />
                    <Suspense fallback={null}>
                      <ModelViewer modelPath={lastWonPrize.modelPath} prizeName={lastWonPrize.name} />
                      <OrbitControls autoRotate enableZoom={false} />
                    </Suspense>
                  </Canvas>
                </div>
              </div>
              
              <div className={styles.prizeDetails}>
                <h3>{lastWonPrize.name}</h3>
                <p>{prizeDescriptions[lastWonPrize.name as keyof typeof prizeDescriptions] || 'A wonderful prize!'}</p>
              </div>
            </>
          )}
          
          <button className={styles.closeButton} onClick={handleCloseModal}>
            Continue Playing
          </button>
        </div>
      </div>
      
      {/* All Prizes Won Modal */}
      <div className={`${styles.modalOverlay} ${showAllPrizesWonModal ? styles.visible : ''}`}>
        {/* Confetti for celebration */}
        {Array.from({ length: 50 }).map((_, i) => {
          const randomColor = [
            '#FF6B6B', '#4ECDC4', '#FFD166', '#06D6A0', '#118AB2',
            '#FF1493', '#FFD700', '#FF4500', '#9400D3', '#32CD32'
          ][Math.floor(Math.random() * 10)];
          
          return (
            <div 
              key={`all-prizes-confetti-${i}`}
              className={styles.confetti}
              style={{
                backgroundColor: randomColor,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`
              }}
            />
          );
        })}
        
        <div className={styles.modalContent}>
          <div className={styles.modalHeader}>
            <h2>🎉 Congratulations! 🎉</h2>
          </div>
          
          <div className={styles.allPrizesMessage}>
            <h3>You&apos;ve collected all of Bree Day&apos;s resume prizes!</h3>
            <p>Thank you for playing Bree Day&apos;s Resume Crane Game!</p>
            <p>Would you like to learn more about Bree&apos;s skills and experience?</p>
            
            <div className={styles.allPrizesButtons}>
              <button className={styles.visitProfileButton} onClick={handleVisitProfile}>
                Visit Bree&apos;s Profile
              </button>
              <button className={styles.playAgainButton} onClick={handleCloseAllPrizesModal}>
                Play Again
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <div className={styles.gameCanvas}>
        <Canvas shadows>
          <PerspectiveCamera makeDefault position={[0, 5, 10]} />
          <OrbitControls 
            enableZoom={true} 
            enablePan={true} 
            maxPolarAngle={Math.PI - 0.1} 
            minPolarAngle={0.1} 
            autoRotate={autoRotate}
            autoRotateSpeed={1}
            enableDamping={true}
            dampingFactor={0.05}
          />
          
          <fog attach="fog" args={["#000", 10, 50]} />
          
          <ambientLight intensity={0.3} />
          <directionalLight
            position={[10, 10, 5]}
            intensity={0.8}
            castShadow
            shadow-mapSize-width={2048}
            shadow-mapSize-height={2048}
          />
          
          {/* Arcade Environment */}
          <ArcadeFloor />
          <ArcadeFloorPattern />
          <ArcadeCeiling />
          
          {/* Walls with neon lights */}
          <ArcadeWall position={[0, 0, -20]} rotation={[0, 0, 0]} color="#ff00ff" />
          <ArcadeWall position={[-20, 0, 0]} rotation={[0, Math.PI/2, 0]} color="#00ffff" />
          <ArcadeWall position={[20, 0, 0]} rotation={[0, -Math.PI/2, 0]} color="#ffff00" />
          
          {/* Other arcade machines */}
          <ArcadeMachine position={[-12, -5, -10]} color="#8B0000" />
          <ArcadeMachine position={[-8, -5, -10]} color="#006400" />
          <ArcadeMachine position={[8, -5, -10]} color="#00008B" />
          <ArcadeMachine position={[12, -5, -10]} color="#4B0082" />
          
          {/* Spotlights on crane machine */}
          <spotLight 
            position={[-5, 8, -5]} 
            angle={0.3} 
            penumbra={0.5} 
            intensity={1.5} 
            color="#ff8800" 
            castShadow 
            target-position={[0, 0, 0]}
          />
          
          <spotLight 
            position={[5, 8, -5]} 
            angle={0.3} 
            penumbra={0.5} 
            intensity={1.5} 
            color="#ff00ff" 
            castShadow 
            target-position={[0, 0, 0]}
          />
          
          {/* Main crane machine */}
          <CraneMachine
            prizes={prizes}
            cranePosition={cranePosition}
            clawPosition={clawPosition}
            isGrabbing={isGrabbing}
            caughtPrize={caughtPrize}
            // isPrizeDropping={false}
            droppedPrizePosition={[0, 0, 0]}
            droppedPrizeRotation={[0, 0, 0]}
            droppedPrizeColor={"#FF6B6B"}
            droppedPrizeScale={[0.8, 0.8, 0.8]}
            isAnimatingPrize={false}
            droppedPrizes={[]}
          />
          
          <WonPrizes prizes={wonPrizes} />
        </Canvas>
      </div>
    </div>
  );
};

export default CraneGame3D;
