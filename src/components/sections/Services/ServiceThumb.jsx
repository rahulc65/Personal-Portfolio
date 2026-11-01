import { useRef } from 'react';
import useFlowmapHover from '../../../hooks/Useflowmaphover';

// hover liquid effect. The thumbnails are tiny, so the brush is relatively large to reach most of the
// image (every knob lives in IMAGE_FLOW_OPTIONS in webgl/FlowmapImage.js)
// maxDpr 3: the canvas is only ~200x90px, so full pixel density is free and keeps the fine detail sharp
const THUMB_FLOW = { falloff: 0.95, distort: 1.7, split: 0.9, shimmer: 0.2, maxDpr: 3 };

export default function ServiceThumb({ src, alt = '', className = '' }) {
  const hostRef = useRef(null);
  const imgRef = useRef(null);
  useFlowmapHover(hostRef, imgRef, THUMB_FLOW);

  return (
    <div ref={hostRef} className={`relative aspect-[2.2/1] w-full overflow-hidden rounded-[3px] bg-[#140806] ${className}`}>
      {src ? (
        <img ref={imgRef} src={src} alt={alt} loading="lazy" className="h-full w-full object-cover" />
      ) : (
        <svg viewBox="0 0 220 100" preserveAspectRatio="xMidYMid slice" className="block h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient id="thumb-bg" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0" stopColor="#140806" />
              <stop offset="0.55" stopColor="#3a1209" />
              <stop offset="1" stopColor="#e2461a" />
            </linearGradient>
          </defs>
          <rect width="220" height="100" fill="url(#thumb-bg)" />
          {/* screen */}
          <rect x="52" y="14" width="116" height="62" rx="3" fill="#f3f1ec" />
          <rect x="52" y="14" width="116" height="7" rx="3" fill="#dcd8d0" />
          <circle cx="58" cy="17.5" r="1.3" fill="#c1440e" />
          <circle cx="63" cy="17.5" r="1.3" fill="#9a958b" />
          <circle cx="68" cy="17.5" r="1.3" fill="#9a958b" />
          <rect x="62" y="30" width="62" height="6" rx="1.5" fill="#14120f" />
          <rect x="62" y="40" width="46" height="6" rx="1.5" fill="#14120f" />
          <rect x="62" y="52" width="34" height="3" rx="1.5" fill="#9a958b" />
          <rect x="62" y="58" width="28" height="3" rx="1.5" fill="#9a958b" />
          <rect x="62" y="65" width="20" height="6" rx="3" fill="#c1440e" />
          <rect x="132" y="30" width="28" height="36" rx="2" fill="#e2461a" opacity="0.9" />
          {/* stand */}
          <path d="M104 76h12l3 10H101z" fill="#d9d5cc" />
          <rect x="92" y="85" width="36" height="3" rx="1.5" fill="#f3f1ec" />
        </svg>
      )}
    </div>
  );
}