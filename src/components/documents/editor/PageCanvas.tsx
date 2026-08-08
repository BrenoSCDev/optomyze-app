import React, { useMemo } from 'react';
import { type PageSettings, pageBox, fontCss } from './pageGeometry';

/**
 * The gap drawn between sheets.
 *
 * Shared with the pagination plugin: it is part of the coordinate system the
 * plugin does its arithmetic in, not decoration. Changing it here without
 * telling the plugin would put every page boundary in the wrong place.
 */
export const PAGE_GAP_PX = 24;

interface PageCanvasProps {
  settings: PageSettings;
  /** The editor (or preview) content. Rendered inside the page column. */
  children: React.ReactNode;
  /** How many sheets to draw. Supplied by whoever measures the content. */
  pageCount: number;
  className?: string;
}

/**
 * The paper the document is drawn on.
 *
 * Sheets at exact A4/Letter dimensions with the configured margins, stacked
 * behind one continuous content column. Where the content breaks across those
 * sheets is decided by PaginationExtension, which pushes any block that would
 * cross a boundary onto the next page — this component only draws.
 *
 * The sheet stays white in dark mode on purpose: it represents paper, and a
 * dark page would misrepresent the artifact the customer receives.
 */
const PageCanvas: React.FC<PageCanvasProps> = ({
  settings,
  children,
  pageCount,
  className,
}) => {
  const box = useMemo(() => pageBox(settings), [settings]);
  const pages = Array.from({ length: Math.max(1, pageCount) });

  return (
    <div className={`doc-canvas flex flex-col items-center py-6 ${className ?? ''}`}>
      <div className="relative" style={{ width: box.widthPx }}>
        {/* Sheets, drawn behind the content. */}
        <div
          className="absolute inset-0 -z-10 flex flex-col items-center pointer-events-none"
          style={{ gap: PAGE_GAP_PX }}
        >
          {pages.map((_, index) => (
            <div
              key={index}
              className="doc-page bg-white shadow-lg rounded-sm relative shrink-0"
              style={{ width: box.widthPx, height: box.heightPx }}
            >
              <div
                className="absolute border border-dashed border-slate-200"
                style={{
                  top: box.marginsPx.top,
                  left: box.marginsPx.left,
                  right: box.marginsPx.right,
                  bottom: box.marginsPx.bottom,
                }}
              />

              <div className="absolute bottom-1 right-2 text-[10px] text-slate-300 select-none">
                {index + 1} / {Math.max(1, pageCount)}
              </div>
            </div>
          ))}
        </div>

        {/*
          The content column. Its padding places the first line exactly at the
          top margin; every boundary after that is the pagination plugin's
          work, since one column cannot otherwise know where a sheet ends.
        */}
        <div
          style={{
            paddingTop: box.marginsPx.top,
            paddingLeft: box.marginsPx.left,
            paddingRight: box.marginsPx.right,
            paddingBottom: box.marginsPx.bottom,
            minHeight: box.heightPx,
            fontFamily: fontCss(settings.font_family),
            fontSize: `${settings.font_size}pt`,
            lineHeight: settings.line_height,
          }}
          className="doc-content relative"
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default PageCanvas;
