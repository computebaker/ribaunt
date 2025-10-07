/**
 * Browser-only entry point for the Ribaunt Widget
 * This file only exports the web component, not the server-side functions
 */

export { RibauntWidget } from './widget.js';

// Auto-register the widget when imported
import './widget.js';
