import type { Metadata } from 'next';
import DigitalSkillsClient from './DigitalSkillsClient';

export const metadata: Metadata = {
  title: 'Digital Skills',
  description:
    'Master the future — interactive courses in Coding, Design, AI, and more. Cinematic learning experience by ExamStitch.',
};

export default function DigitalSkillsPage() {
  return <DigitalSkillsClient />;
}
