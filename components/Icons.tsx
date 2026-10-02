import type { SVGProps } from "react";

// One consistent family: 24px grid, 1.75 stroke, rounded caps. Decorative by
// default (aria-hidden) - the parent button carries the accessible name.
function Svg(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      width={20}
      height={20}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.75}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      {...props}
    />
  );
}

export const ArrowLeft = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></Svg>
);
export const ArrowRight = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M5 12h14M13 6l6 6-6 6" /></Svg>
);
export const List = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M8 6h12M8 12h12M8 18h12M4 6h.01M4 12h.01M4 18h.01" /></Svg>
);
export const Close = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
);
export const Check = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
);
export const Chat = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M21 12a8 8 0 0 1-11.6 7.1L4 20l1-4.6A8 8 0 1 1 21 12z" /></Svg>
);
export const Send = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M5 12l14-7-5 14-2.5-5.5L5 12z" /></Svg>
);
export const Play = (p: SVGProps<SVGSVGElement>) => (
  <Svg fill="currentColor" stroke="none" {...p}><path d="M8 5.5v13a1 1 0 0 0 1.5.9l10.5-6.5a1 1 0 0 0 0-1.8L9.5 4.6A1 1 0 0 0 8 5.5z" /></Svg>
);
export const Pause = (p: SVGProps<SVGSVGElement>) => (
  <Svg fill="currentColor" stroke="none" {...p}><rect x="6" y="5" width="4" height="14" rx="1" /><rect x="14" y="5" width="4" height="14" rx="1" /></Svg>
);
export const Replay10 = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M4 12a8 8 0 1 0 2.5-5.8M4 4v4.5h4.5" /><text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="currentColor" stroke="none">10</text></Svg>
);
export const Forward10 = (p: SVGProps<SVGSVGElement>) => (
  <Svg {...p}><path d="M20 12a8 8 0 1 1-2.5-5.8M20 4v4.5h-4.5" /><text x="12" y="15.5" textAnchor="middle" fontSize="7.5" fontWeight="600" fill="currentColor" stroke="none">10</text></Svg>
);
