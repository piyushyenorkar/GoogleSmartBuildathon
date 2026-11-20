import React from 'react';

export const ROLE_ICON_URLS: Record<string, string | null> = {
  'Frontend': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg',
  'Backend': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg',
  'Full Stack': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
  'AI/ML': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tensorflow/tensorflow-original.svg',
  'Data Science': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/pandas/pandas-original.svg',
  'UI/UX Designer': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/figma/figma-original.svg',
  'DevOps': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg',
  'Mobile Dev': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/flutter/flutter-original.svg',
  'Blockchain': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/solidity/solidity-original.svg',
  'Cybersecurity': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/linux/linux-original.svg',
  'Cloud': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/googlecloud/googlecloud-original.svg',
  'Game Dev': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/unity/unity-original.svg',
  'IoT': 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/arduino/arduino-original.svg',
  'AR/VR': null,
  'Project Manager': null,
  'Content Writer': null,
  'Video Editor': null,
  'Marketing': null,
};

export const ROLE_EMOJI: Record<string, string> = {
  'AR/VR': '🥽',
  'Project Manager': '📊',
  'Content Writer': '✍️',
  'Video Editor': '🎬',
  'Marketing': '📈',
};

export const TEAM_ROLES = [
  'Frontend', 'Backend', 'Full Stack', 'AI/ML', 'Data Science',
  'UI/UX Designer', 'DevOps', 'Mobile Dev', 'Blockchain',
  'Cybersecurity', 'Cloud', 'Game Dev', 'IoT', 'AR/VR',
  'Project Manager', 'Content Writer', 'Video Editor', 'Marketing'
];

export function RoleIcon({ role, size = 14 }: { role: string; size?: number }) {
  const url = ROLE_ICON_URLS[role];
  const emoji = ROLE_EMOJI[role];
  
  if (url) {
    return <img src={url} alt={role} style={{ width: size, height: size, objectFit: 'contain' }} />;
  }
  if (emoji) {
    return <span style={{ fontSize: size - 2, lineHeight: `${size}px`, display: 'inline-block' }}>{emoji}</span>;
  }
  return null;
}
