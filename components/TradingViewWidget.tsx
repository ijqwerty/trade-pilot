'use client';

import React, { memo } from 'react';
import useTradingViewWidget from "@/hooks/useTradingViewWidget";
import {cn} from "@/lib/utils";

interface TradingViewWidgetProps {
    title?: string;
    /** Quiet packet note under the title (e.g. third-party disclaimer). */
    note?: string;
    scriptUrl: string;
    config: Record<string, unknown>;
    height?: number;
    className?: string;
    /** Quieter label treatment for market-context / secondary embeds. */
    quiet?: boolean;
}

const TradingViewWidget = ({ title, note, scriptUrl, config, height = 600, className, quiet = false }: TradingViewWidgetProps) => {
    const containerRef = useTradingViewWidget(scriptUrl, config, height);

    return (
        <div className={cn('w-full', quiet && 'tv-widget--quiet')}>
            {title ? (
                <h3 className={quiet ? 'tv-widget-title tv-widget-title--quiet' : 'tv-widget-title'}>
                    {title}
                </h3>
            ) : null}
            {note ? <p className="tv-widget-note">{note}</p> : null}
            <div className={cn('tradingview-widget-container', className)} ref={containerRef}>
                <div className="tradingview-widget-container__widget" style={{ height, width: "100%" }} />
            </div>
        </div>
    );
}

export default memo(TradingViewWidget);
