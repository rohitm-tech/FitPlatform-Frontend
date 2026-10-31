import { ContactShadows, Environment, Lightformer } from '@react-three/drei';

// Soft studio lighting for the body rig.
export function SceneSetup() {
  return (
    <>
      <color attach="background" args={['#080808']} />
      <fog attach="fog" args={['#080808', 8, 16]} />

      <ambientLight intensity={0.3} />
      <hemisphereLight args={['#fff5ee', '#1a1210', 0.4]} />

      <directionalLight
        castShadow
        position={[3.5, 6.5, 3]}
        intensity={1.6}
        color="#fff8f2"
        shadow-mapSize={[1024, 1024]}
      />
      <directionalLight position={[-3, 3, -1.5]} intensity={0.5} color="#d0e0ff" />

      <Environment resolution={256} background={false}>
        <Lightformer intensity={1} position={[0, 4, 2]} scale={[8, 1.5, 1]} form="rect" />
        <Lightformer intensity={0.5} position={[-3, 2, -2]} scale={[4, 3, 1]} form="rect" color="#b8d0ff" />
      </Environment>

      <ContactShadows position={[0, 0.01, 0]} opacity={0.5} scale={5} blur={2.5} far={3.5} />
    </>
  );
}

export default SceneSetup;
