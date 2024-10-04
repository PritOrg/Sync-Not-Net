import React, { useEffect, useState } from 'react';

function getRandomPastelColor() {
  const r = Math.floor(Math.random() * 127 + 127);
  const g = Math.floor(Math.random() * 127 + 127);
  const b = Math.floor(Math.random() * 127 + 127);
  return `rgb(${r}, ${g}, ${b})`;
}

function getContrastingColor(rgb) {
  const [r, g, b] = rgb.match(/\d+/g).map(Number);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 186 ? 'black' : 'white';
}

function PastelBackground({ children }) {
  const [backgroundColor1, setBackgroundColor1] = useState('');
  const [backgroundColor2, setBackgroundColor2] = useState('');
  const [fontColor, setFontColor] = useState('black');

  useEffect(() => {
    const newBackgroundColor1 = getRandomPastelColor();
    const newBackgroundColor2 = getRandomPastelColor();
    setBackgroundColor1(newBackgroundColor1);
    setBackgroundColor2(newBackgroundColor2);
  }, []);

  // Update font color whenever backgroundColor1 changes
  useEffect(() => {
    if (backgroundColor1) {
      setFontColor(getContrastingColor(backgroundColor1));
    }
  }, [backgroundColor1]);

  const gradientStyle = {
    background: `linear-gradient(to right, ${backgroundColor1}, ${backgroundColor2})`,
    minHeight: '100vh',
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '0 20px',
  };

  return (
    <div style={gradientStyle}>
      {React.Children.map(children, child => 
        React.cloneElement(child, { style: { color: fontColor, backgroundColor: 'transparent' } })
      )}
    </div>
  );
}

export default PastelBackground;
