import { Metadata } from 'next';
import StemLanding from './StemLanding';

export const metadata: Metadata = {
  title: 'STEM Interactive Hub',
  description:
    'Explore interactive 3D simulations for Mathematics and Science — geometry, vectors, calculus, atomic structure, pendulums, and chemical bonding.',
};

export default function StemPage() {
  return <StemLanding />;
}
