import { Canvas } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Sphere } from '@react-three/drei';

const FloatingShape = ({ position, color, speed }: { position: [number, number, number], color: string, speed: number }) => (
  <Float speed={speed} rotationIntensity={1} floatIntensity={2}>
    <Sphere args={[1, 64, 64]} position={position}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={0.4}
        speed={2}
        roughness={0.2}
        metalness={0.8}
      />
    </Sphere>
  </Float>
);

export const ThreeBackground = () => {
  return (
    <div className="absolute inset-0 opacity-30 pointer-events-none">
      <Canvas camera={{ position: [0, 0, 10], fov: 50 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[10, 10, 5]} intensity={1} />
        <pointLight position={[-10, -10, -5]} intensity={0.5} color="#a855f7" />
        
        <FloatingShape position={[-4, 2, 0]} color="#fbbf24" speed={1.5} />
        <FloatingShape position={[4, -2, -2]} color="#f59e0b" speed={2} />
        <FloatingShape position={[0, 3, -3]} color="#fcd34d" speed={1.8} />
        <FloatingShape position={[3, 1, -1]} color="#d1d5db" speed={1.3} />
        <FloatingShape position={[-3, -3, -2]} color="#9ca3af" speed={2.2} />
      </Canvas>
    </div>
  );
};
