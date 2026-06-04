import React from 'react';
import logoSrc from '../../assets/logo.png';

interface RetrivinLogoProps {
  size?: number;
  className?: string;
}

const RetrivinLogo: React.FC<RetrivinLogoProps> = ({ 
  size = 24, 
  className = ''
}) => (
  <img 
    src={logoSrc} 
    alt="Retrivin" 
    width={size} 
    height={size} 
    className={className}
    style={{ objectFit: 'contain' }} 
  />
);

export default RetrivinLogo;
