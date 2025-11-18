/**
 * Felanmälan Widget - Standalone Entry Point
 *
 * Exports a global FelanmalanWidget object that can be embedded in any page
 */

import React from 'react';
import { createRoot } from 'react-dom/client';
import FelanmalanWidget from './FelanmalanWidget';
import './styles.css';

// Global initialization function
window.FelanmalanWidget = {
  /**
   * Initialize the widget
   *
   * @param {Object} config Configuration object
   * @param {string} config.containerId - DOM element ID to render widget into
   * @param {string} config.apiEndpoint - Joomla AJAX endpoint URL
   * @param {Object} config.userData - User data (name, email, phone)
   * @param {string} config.kundNr - Customer number
   * @param {string} config.googleMapsApiKey - Google Maps API key (optional)
   */
  init: function(config) {
    const container = document.getElementById(config.containerId);

    if (!container) {
      console.error('FelanmalanWidget: Container not found:', config.containerId);
      return;
    }

    const root = createRoot(container);
    root.render(
      <React.StrictMode>
        <FelanmalanWidget
          apiEndpoint={config.apiEndpoint}
          userData={config.userData}
          kundNr={config.kundNr}
          googleMapsApiKey={config.googleMapsApiKey}
        />
      </React.StrictMode>
    );
  }
};

export default window.FelanmalanWidget;
