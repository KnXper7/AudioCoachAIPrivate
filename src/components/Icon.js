// Icon.js — minimal geometric line icons, ported from the design (react-native-svg)
import React from 'react';
import Svg, { G, Path, Circle, Rect } from 'react-native-svg';

export default function Icon({ name, size = 24, stroke = '#fff', sw = 1.6, style }) {
  const common = {
    fill: 'none',
    stroke,
    strokeWidth: sw,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
  };

  const paths = {
    face: (
      <G {...common}>
        <Circle cx="12" cy="12" r="9" />
        <Path d="M8.5 14.5c1 1.2 2.2 1.8 3.5 1.8s2.5-.6 3.5-1.8" />
        <Path d="M9 10h.01M15 10h.01" strokeWidth={2.2} />
      </G>
    ),
    outfit: (
      <G {...common}>
        <Path d="M8.5 3.5 12 6l3.5-2.5L20 6.5l-2.5 3-1.5-1V20.5h-8V8.5l-1.5 1L4 6.5z" />
      </G>
    ),
    camera: (
      <G {...common}>
        <Path d="M4 8.5A2.5 2.5 0 0 1 6.5 6h1L9 4h6l1.5 2h1A2.5 2.5 0 0 1 20 8.5v8A2.5 2.5 0 0 1 17.5 19h-11A2.5 2.5 0 0 1 4 16.5z" />
        <Circle cx="12" cy="12.5" r="3.5" />
      </G>
    ),
    image: (
      <G {...common}>
        <Rect x="3.5" y="4.5" width="17" height="15" rx="2.5" />
        <Circle cx="8.5" cy="9.5" r="1.6" />
        <Path d="m4 17 4.5-4.5L12 16l3-3 5 5" />
      </G>
    ),
    home: (
      <G {...common}>
        <Path d="M4 11.5 12 4l8 7.5" />
        <Path d="M6 10.5v9h12v-9" />
      </G>
    ),
    history: (
      <G {...common}>
        <Circle cx="12" cy="12" r="8.5" />
        <Path d="M12 7.5V12l3 2" />
      </G>
    ),
    user: (
      <G {...common}>
        <Circle cx="12" cy="8.5" r="3.8" />
        <Path d="M5.5 19.5a6.5 6.5 0 0 1 13 0" />
      </G>
    ),
    spark: (
      <G {...common}>
        <Path d="M12 3.5c.4 3.8 1.7 5.1 5.5 5.5-3.8.4-5.1 1.7-5.5 5.5-.4-3.8-1.7-5.1-5.5-5.5 3.8-.4 5.1-1.7 5.5-5.5Z" />
        <Path d="M18 14.5c.2 1.9.9 2.6 2.8 2.8-1.9.2-2.6.9-2.8 2.8-.2-1.9-.9-2.6-2.8-2.8 1.9-.2 2.6-.9 2.8-2.8Z" />
      </G>
    ),
    chevron: (
      <G {...common}>
        <Path d="m9 5 7 7-7 7" />
      </G>
    ),
    chevDown: (
      <G {...common}>
        <Path d="m5 9 7 7 7-7" />
      </G>
    ),
    back: (
      <G {...common}>
        <Path d="m15 5-7 7 7 7" />
      </G>
    ),
    close: (
      <G {...common}>
        <Path d="M6 6 18 18M18 6 6 18" />
      </G>
    ),
    share: (
      <G {...common}>
        <Path d="M12 15V4M8.5 7 12 3.5 15.5 7" />
        <Path d="M6 11.5H5a1.5 1.5 0 0 0-1.5 1.5v6A1.5 1.5 0 0 0 5 20.5h14a1.5 1.5 0 0 0 1.5-1.5v-6A1.5 1.5 0 0 0 19 11.5h-1" />
      </G>
    ),
    lock: (
      <G {...common}>
        <Rect x="5" y="10.5" width="14" height="10" rx="2.5" />
        <Path d="M8 10.5V8a4 4 0 0 1 8 0v2.5" />
      </G>
    ),
    check: (
      <G {...common}>
        <Path d="m5 12.5 4.5 4.5L19 7" />
      </G>
    ),
    flip: (
      <G {...common}>
        <Path d="M4 8a8 8 0 0 1 13-3l2 2M20 6v3h-3" />
        <Path d="M20 16a8 8 0 0 1-13 3l-2-2M4 18v-3h3" />
      </G>
    ),
    bolt: (
      <G {...common}>
        <Path d="M13 3 5 13h5l-1 8 8-10h-5l1-8Z" />
      </G>
    ),
    infinity: (
      <G {...common}>
        <Path d="M9 12c0-2-1.4-3.2-3-3.2S3 10 3 12s1.4 3.2 3 3.2S9 14 9 12c0-2 1.4-3.2 3-3.2s3 1.2 3 3.2-1.4 3.2-3 3.2S9 14 9 12" />
      </G>
    ),
  };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      {paths[name]}
    </Svg>
  );
}
