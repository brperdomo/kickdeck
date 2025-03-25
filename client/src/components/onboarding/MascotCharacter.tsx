import React from 'react';
import { cn } from '@/lib/utils';

export type MascotEmotion = 'happy' | 'excited' | 'thinking' | 'pointing' | 'waving';
type MascotSize = 'sm' | 'md' | 'lg';

interface MascotCharacterProps {
  emotion?: MascotEmotion;
  size?: MascotSize;
  className?: string;
  animated?: boolean;
}

// Character base SVG paths for each emotion
const emotions: Record<MascotEmotion, React.ReactNode> = {
  happy: (
    <>
      <path
        d="M45.5 35C45.5 40.2467 41.2467 44.5 36 44.5C30.7533 44.5 26.5 40.2467 26.5 35C26.5 29.7533 30.7533 25.5 36 25.5C41.2467 25.5 45.5 29.7533 45.5 35Z"
        fill="#4ADE80"
        stroke="#15803D"
        strokeWidth="2"
      />
      <path
        d="M32 35C32 36.6569 30.6569 38 29 38C27.3431 38 26 36.6569 26 35C26 33.3431 27.3431 32 29 32C30.6569 32 32 33.3431 32 35Z"
        fill="white"
      />
      <path
        d="M43 35C43 36.6569 41.6569 38 40 38C38.3431 38 37 36.6569 37 35C37 33.3431 38.3431 32 40 32C41.6569 32 43 33.3431 43 35Z"
        fill="white"
      />
      <path
        d="M32 35C32 35.5523 31.5523 36 31 36C30.4477 36 30 35.5523 30 35C30 34.4477 30.4477 34 31 34C31.5523 34 32 34.4477 32 35Z"
        fill="#1E293B"
      />
      <path
        d="M42 35C42 35.5523 41.5523 36 41 36C40.4477 36 40 35.5523 40 35C40 34.4477 40.4477 34 41 34C41.5523 34 42 34.4477 42 35Z"
        fill="#1E293B"
      />
      <path d="M36 38C38.5 38 39.5 39.5 39.5 39.5C39.5 39.5 38 41 36 41C34 41 32.5 39.5 32.5 39.5C32.5 39.5 33.5 38 36 38Z" fill="#15803D" />
    </>
  ),
  excited: (
    <>
      <path
        d="M45.5 35C45.5 40.2467 41.2467 44.5 36 44.5C30.7533 44.5 26.5 40.2467 26.5 35C26.5 29.7533 30.7533 25.5 36 25.5C41.2467 25.5 45.5 29.7533 45.5 35Z"
        fill="#4ADE80"
        stroke="#15803D"
        strokeWidth="2"
      />
      <path
        d="M32 34C32 35.6569 30.6569 37 29 37C27.3431 37 26 35.6569 26 34C26 32.3431 27.3431 31 29 31C30.6569 31 32 32.3431 32 34Z"
        fill="white"
      />
      <path
        d="M46 34C46 35.6569 44.6569 37 43 37C41.3431 37 40 35.6569 40 34C40 32.3431 41.3431 31 43 31C44.6569 31 46 32.3431 46 34Z"
        fill="white"
      />
      <path
        d="M30 34C30 34.5523 29.5523 35 29 35C28.4477 35 28 34.5523 28 34C28 33.4477 28.4477 33 29 33C29.5523 33 30 33.4477 30 34Z"
        fill="#1E293B"
      />
      <path
        d="M44 34C44 34.5523 43.5523 35 43 35C42.4477 35 42 34.5523 42 34C42 33.4477 42.4477 33 43 33C43.5523 33 44 33.4477 44 34Z"
        fill="#1E293B"
      />
      <path
        d="M30 39C30 37.3431 32.6863 36 36 36C39.3137 36 42 37.3431 42 39C42 40.6569 39.3137 42 36 42C32.6863 42 30 40.6569 30 39Z"
        fill="#15803D"
      />
    </>
  ),
  thinking: (
    <>
      <path
        d="M45.5 35C45.5 40.2467 41.2467 44.5 36 44.5C30.7533 44.5 26.5 40.2467 26.5 35C26.5 29.7533 30.7533 25.5 36 25.5C41.2467 25.5 45.5 29.7533 45.5 35Z"
        fill="#4ADE80"
        stroke="#15803D"
        strokeWidth="2"
      />
      <path
        d="M32 35C32 36.6569 30.6569 38 29 38C27.3431 38 26 36.6569 26 35C26 33.3431 27.3431 32 29 32C30.6569 32 32 33.3431 32 35Z"
        fill="white"
      />
      <path
        d="M43 35C43 36.6569 41.6569 38 40 38C38.3431 38 37 36.6569 37 35C37 33.3431 38.3431 32 40 32C41.6569 32 43 33.3431 43 35Z"
        fill="white"
      />
      <path
        d="M30 36C30 36.5523 29.5523 37 29 37C28.4477 37 28 36.5523 28 36C28 35.4477 28.4477 35 29 35C29.5523 35 30 35.4477 30 36Z"
        fill="#1E293B"
      />
      <path
        d="M42 36C42 36.5523 41.5523 37 41 37C40.4477 37 40 36.5523 40 36C40 35.4477 40.4477 35 41 35C41.5523 35 42 35.4477 42 36Z"
        fill="#1E293B"
      />
      <path
        d="M33 41C33 39.8954 34.3431 39 36 39C37.6569 39 39 39.8954 39 41"
        stroke="#15803D"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <path d="M42 26L48 22" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      <path d="M48 22L48 28" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  pointing: (
    <>
      <path
        d="M45.5 35C45.5 40.2467 41.2467 44.5 36 44.5C30.7533 44.5 26.5 40.2467 26.5 35C26.5 29.7533 30.7533 25.5 36 25.5C41.2467 25.5 45.5 29.7533 45.5 35Z"
        fill="#4ADE80"
        stroke="#15803D"
        strokeWidth="2"
      />
      <path
        d="M32 34C32 35.6569 30.6569 37 29 37C27.3431 37 26 35.6569 26 34C26 32.3431 27.3431 31 29 31C30.6569 31 32 32.3431 32 34Z"
        fill="white"
      />
      <path
        d="M46 34C46 35.6569 44.6569 37 43 37C41.3431 37 40 35.6569 40 34C40 32.3431 41.3431 31 43 31C44.6569 31 46 32.3431 46 34Z"
        fill="white"
      />
      <path
        d="M30 34C30 34.5523 29.5523 35 29 35C28.4477 35 28 34.5523 28 34C28 33.4477 28.4477 33 29 33C29.5523 33 30 33.4477 30 34Z"
        fill="#1E293B"
      />
      <path
        d="M44 34C44 34.5523 43.5523 35 43 35C42.4477 35 42 34.5523 42 34C42 33.4477 42.4477 33 43 33C43.5523 33 44 33.4477 44 34Z"
        fill="#1E293B"
      />
      <path d="M36 38C38.5 38 39.5 39.5 39.5 39.5C39.5 39.5 38 41 36 41C34 41 32.5 39.5 32.5 39.5C32.5 39.5 33.5 38 36 38Z" fill="#15803D" />
      <path d="M46 30L52 24" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 24L52 30" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
      <path d="M52 24L46 24" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
  waving: (
    <>
      <path
        d="M45.5 35C45.5 40.2467 41.2467 44.5 36 44.5C30.7533 44.5 26.5 40.2467 26.5 35C26.5 29.7533 30.7533 25.5 36 25.5C41.2467 25.5 45.5 29.7533 45.5 35Z"
        fill="#4ADE80"
        stroke="#15803D"
        strokeWidth="2"
      />
      <path
        d="M32 35C32 36.6569 30.6569 38 29 38C27.3431 38 26 36.6569 26 35C26 33.3431 27.3431 32 29 32C30.6569 32 32 33.3431 32 35Z"
        fill="white"
      />
      <path
        d="M43 35C43 36.6569 41.6569 38 40 38C38.3431 38 37 36.6569 37 35C37 33.3431 38.3431 32 40 32C41.6569 32 43 33.3431 43 35Z"
        fill="white"
      />
      <path
        d="M30 35C30 35.5523 29.5523 36 29 36C28.4477 36 28 35.5523 28 35C28 34.4477 28.4477 34 29 34C29.5523 34 30 34.4477 30 35Z"
        fill="#1E293B"
      />
      <path
        d="M42 35C42 35.5523 41.5523 36 41 36C40.4477 36 40 35.5523 40 35C40 34.4477 40.4477 34 41 34C41.5523 34 42 34.4477 42 35Z"
        fill="#1E293B"
      />
      <path d="M36 38C38.5 38 39.5 39.5 39.5 39.5C39.5 39.5 38 41 36 41C34 41 32.5 39.5 32.5 39.5C32.5 39.5 33.5 38 36 38Z" fill="#15803D" />
      <path d="M46 26L48 24L52 28L50 30L46 26Z" fill="#4ADE80" stroke="#15803D" strokeWidth="2" strokeLinejoin="round" />
      <path d="M48 24L52 20" stroke="#15803D" strokeWidth="2" strokeLinecap="round" />
    </>
  ),
};

const sizeClass: Record<MascotSize, string> = {
  sm: 'w-12 h-12',
  md: 'w-20 h-20',
  lg: 'w-32 h-32',
};

export const MascotCharacter: React.FC<MascotCharacterProps> = ({ 
  emotion = 'happy', 
  size = 'md',
  className,
  animated = true
}) => {
  return (
    <div
      className={cn(
        sizeClass[size],
        animated && 'transition-transform duration-300 hover:scale-110',
        className
      )}
    >
      <svg
        viewBox="0 0 72 72"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={cn(
          'w-full h-full',
          animated && emotion === 'waving' && 'animate-wave'
        )}
      >
        {/* Soccer ball body */}
        <circle cx="36" cy="36" r="34" fill="white" stroke="#0F172A" strokeWidth="2" />
        <path
          d="M36 68C53.6731 68 68 53.6731 68 36C68 18.3269 53.6731 4 36 4C18.3269 4 4 18.3269 4 36C4 53.6731 18.3269 68 36 68Z"
          fill="white"
          stroke="#0F172A"
          strokeWidth="3"
        />
        <path
          d="M36 65C52.0163 65 65 52.0163 65 36C65 19.9837 52.0163 7 36 7C19.9837 7 7 19.9837 7 36C7 52.0163 19.9837 65 36 65Z"
          stroke="#0F172A"
          strokeWidth="2"
        />
        
        {/* Soccer ball pattern */}
        <path d="M36 15L25 28H47L36 15Z" fill="#0F172A" />
        <path d="M25 28L14 42H36L25 28Z" fill="#0F172A" />
        <path d="M47 28L36 42H58L47 28Z" fill="#0F172A" />
        <path d="M36 42L25 56H47L36 42Z" fill="#0F172A" />
        <path d="M14 42V42.5L25 56L36 42L14 42Z" fill="#0F172A" />
        <path d="M58 42L36 42L47 56L58 42Z" fill="#0F172A" />
        
        {/* Face */}
        {emotions[emotion]}
      </svg>
    </div>
  );
};

export default MascotCharacter;