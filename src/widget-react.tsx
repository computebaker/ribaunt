'use client';

import React, { useEffect, useRef, forwardRef, useImperativeHandle, useState } from 'react';
import type { RibauntWidgetElement, WidgetState } from './widget.js';

export interface RibauntWidgetProps extends Omit<React.HTMLAttributes<RibauntWidgetElement>, 'onError'> {
  challengeEndpoint?: string;
  verifyEndpoint?: string;
  showWarning?: boolean | string;
  warningMessage?: string;
  disabled?: boolean | string;
  onVerify?: (detail: { solutions: any[] }) => void;
  onError?: (detail: { error: string }) => void;
  onStateChange?: (detail: { state: WidgetState }) => void;
}

export interface RibauntWidgetHandle {
  reset: () => void;
  getState: () => WidgetState | '';
  startVerification: () => void;
}

/**
 * React wrapper for the Ribaunt Web Component.
 * Safely loads the web component dynamically, avoiding Next.js SSR issues.
 */
export const RibauntWidget = forwardRef<RibauntWidgetHandle, RibauntWidgetProps>(
  (
    {
      challengeEndpoint,
      verifyEndpoint,
      showWarning,
      warningMessage,
      disabled,
      onVerify,
      onError,
      onStateChange,
      ...props
    },
    ref
  ) => {
    const widgetRef = useRef<RibauntWidgetElement | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isLoading, setIsLoading] = useState(true);

    useImperativeHandle(ref, () => ({
      reset: () => widgetRef.current?.reset(),
      getState: () => widgetRef.current?.getState() ?? '',
      startVerification: () => widgetRef.current?.startVerification(),
    }));

    useEffect(() => {
      // Dynamically import the browser component to bypass SSR issues
      import('./widget-browser.js')
        .then(() => {
          setIsLoading(false);
        })
        .catch(console.error);
    }, []);

    useEffect(() => {
      const widget = widgetRef.current;
      if (!widget || isLoading) return;

      const handleVerify = (e: Event) => {
        if (onVerify) {
          const customEvent = e as CustomEvent<{ solutions: any[] }>;
          onVerify(customEvent.detail);
        }
      };

      const handleError = (e: Event) => {
        if (onError) {
          const customEvent = e as CustomEvent<{ error: string }>;
          onError(customEvent.detail);
        }
      };

      const handleStateChange = (e: Event) => {
        if (onStateChange) {
          const customEvent = e as CustomEvent<{ state: WidgetState }>;
          onStateChange(customEvent.detail);
        }
      };

      widget.addEventListener('verify', handleVerify);
      widget.addEventListener('error', handleError);
      widget.addEventListener('state-change', handleStateChange);

      return () => {
        widget.removeEventListener('verify', handleVerify);
        widget.removeEventListener('error', handleError);
        widget.removeEventListener('state-change', handleStateChange);
      };
    }, [isLoading, onVerify, onError, onStateChange]);

    useEffect(() => {
      if (!isLoading && containerRef.current && !widgetRef.current) {
        const widget = document.createElement('ribaunt-widget') as RibauntWidgetElement;
        
        // Map camelCase props to kebab-case attributes
        if (challengeEndpoint) widget.setAttribute('challenge-endpoint', challengeEndpoint);
        if (verifyEndpoint) widget.setAttribute('verify-endpoint', verifyEndpoint);
        if (showWarning !== undefined) widget.setAttribute('show-warning', String(showWarning));
        if (warningMessage) widget.setAttribute('warning-message', warningMessage);
        if (disabled !== undefined) widget.setAttribute('disabled', String(disabled));
        
        // Apply any remaining standard HTML attributes to the element
        Object.entries(props).forEach(([key, value]) => {
          if (value !== undefined) {
            // Check if it's a valid property of the HTML element, if so set it
            if (key in widget) {
               (widget as any)[key] = value;
            } else {
               widget.setAttribute(key, String(value));
            }
          }
        });
        
        containerRef.current.appendChild(widget);
        widgetRef.current = widget;
      }
    }, [isLoading, challengeEndpoint, verifyEndpoint, showWarning, warningMessage, disabled, props]);

    return isLoading ? null : <div ref={containerRef} />;
  }
);

RibauntWidget.displayName = 'RibauntWidget';

export default RibauntWidget;
