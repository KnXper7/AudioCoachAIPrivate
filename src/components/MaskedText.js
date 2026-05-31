// MaskedText.js — gradient-filled text via SVG (used for the big tier letter)
import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Text as SvgText } from 'react-native-svg';

export default function MaskedText({ text, colors = ['#9b8cff', '#4ad6c2'], style = {} }) {
  const fontSize = style.fontSize || 110;
  const w = fontSize * 1.4;
  const h = fontSize * 1.1;
  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="txtGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={colors[0]} />
          <Stop offset="1" stopColor={colors[1]} />
        </LinearGradient>
      </Defs>
      <SvgText
        fill="url(#txtGrad)"
        fontSize={fontSize}
        fontFamily={style.fontFamily}
        x={w / 2}
        y={h * 0.78}
        textAnchor="middle"
      >
        {text}
      </SvgText>
    </Svg>
  );
}
