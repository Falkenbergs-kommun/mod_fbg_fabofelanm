/**
 * API Client for Joomla AJAX Integration
 *
 * Modified version of the Next.js apiClient that works with Joomla AJAX endpoints
 */

import React, { createContext, useContext } from 'react';

// Create context for API configuration
const ApiClientContext = createContext(null);

/**
 * Provider component to inject API configuration
 */
export function ApiClientProvider({ children, apiEndpoint, kundId, kundNr }) {
  const client = new ApiClient(apiEndpoint, kundId, kundNr);

  return (
    <ApiClientContext.Provider value={client}>
      {children}
    </ApiClientContext.Provider>
  );
}

/**
 * Hook to use API client
 */
export function useApiClient() {
  const client = useContext(ApiClientContext);
  if (!client) {
    throw new Error('useApiClient must be used within ApiClientProvider');
  }
  return client;
}

/**
 * API Client Class
 */
class ApiClient {
  constructor(apiEndpoint, kundId, kundNr) {
    this.apiEndpoint = apiEndpoint;
    this.kundId = kundId;  // For listing objects
    this.kundNr = kundNr;  // For creating work orders
  }

  /**
   * Make a request to Joomla AJAX endpoint
   */
  async request(path, method = 'GET', body = null) {
    const url = new URL(this.apiEndpoint);
    url.searchParams.set('method', 'proxy');
    url.searchParams.set('path', path);
    url.searchParams.set('http_method', method);

    const options = {
      method: 'POST', // Always POST to Joomla AJAX
      headers: {},
    };

    if (body && (method === 'POST' || method === 'PUT')) {
      if (body instanceof FormData) {
        // For file uploads, send as FormData
        options.body = body;
      } else {
        // For JSON, stringify and set content type
        options.headers['Content-Type'] = 'application/json';
        options.body = JSON.stringify(body);
      }
    }

    const response = await fetch(url.toString(), options);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'API request failed');
    }

    return result.data;
  }

  // Upload temporary file
  async uploadTempFile(file) {
    const formData = new FormData();
    formData.append('file', file);

    return this.request('/ao-produkt/v1/filetransfer/tempfile', 'POST', formData);
  }

  // Attach files to work order
  async attachFilesToWorkOrder(arbetsorderId, filePayload) {
    return this.request(`/ao-produkt/v1/arbetsorder/${arbetsorderId}/filer`, 'POST', filePayload);
  }

  // Create work order
  async createWorkOrder(workOrder) {
    return this.request('/ao-produkt/v1/arbetsorder', 'POST', workOrder);
  }

  // Get work order by ID
  async getWorkOrder(id) {
    return this.request(`/v1/arbetsorder/${id}`, 'GET');
  }

  // List work orders for object
  async listWorkOrdersForObject(objektId) {
    const path = `/ao-produkt/v1/arbetsorder?objektId=${objektId}&status=PAGAR,REG,GODK&feltyp=F,U,T`;
    return this.request(path, 'GET');
  }

  // List objekt (properties)
  async listObjekt() {
    const response = await this.request('/ao-produkt/v1/fastastrukturen/objekt/felanmalningsbara/uthyrningsbara', 'POST', {
      filter: {
        kundId: this.kundId  // Use kundId (numeric) for filtering objects
      }
    });

    // PHP BFF wraps the response in { success, status, data }
    // So the actual API data is at response.data
    const data = response.data || response;

    // Transform GraphQL-style response to our format
    if (data.edges && Array.isArray(data.edges)) {
      return {
        objekt: data.edges.map((edge) => {
          const node = edge.node;

          // Transform real API format to match our Objekt interface
          return {
            id: node.id,
            objektNr: node.id, // Use ID as objektNr
            namn: node.adress?.adress || 'Okänd fastighet', // Use street address as name
            adress: node.adress,
            lat: 0, // Coordinates not provided by real API for this endpoint
            lng: 0,
            kategori: node.typ?.objektsTyp?.toLowerCase() || 'ovrig',
            fastighet: {
              fastighetId: node.relationer?.fastighetNr || '',
              fastighetNamn: `Fastighet ${node.relationer?.fastighetNr || ''}`
            },
            xkoord: node.adress?.xkoord,
            ykoord: node.adress?.ykoord
          };
        }),
        pageInfo: data.pageInfo
      };
    }

    return data;
  }

  // List utrymmen (spaces)
  async listUtrymmen(objektId) {
    const response = await this.request(`/ao-produkt/v1/fastastrukturen/utrymmen?objektId=${objektId}`, 'GET');

    // PHP BFF wraps the response in { success, status, data }
    const data = response.data || response;

    // Transform real API response format to our format
    // Real API returns: [{ id, beskrivning, rumsnummer, utrymmesTypKod }]
    // We need: { utrymmen: [{ id, namn, objektId, typ }] }
    if (Array.isArray(data)) {
      return {
        utrymmen: data.map((item) => ({
          id: item.id.toString(),
          namn: item.beskrivning || 'Okänt utrymme',
          objektId: objektId,
          typ: 'inomhus' // Default since real API doesn't distinguish
        }))
      };
    }

    return data;
  }

  // List enheter (units)
  async listEnheter(utrymmesId) {
    const response = await this.request(`/ao-produkt/v1/fastastrukturen/enheter?utrymmesId=${utrymmesId}`, 'GET');

    // PHP BFF wraps the response in { success, status, data }
    const data = response.data || response;

    // Transform real API response format to our format
    // Real API returns: [{ id, beskrivning, enhetstypBesk, ... }]
    // We need: { enheter: [{ id, namn, utrymmesId }] }
    if (Array.isArray(data)) {
      return {
        enheter: data.map((item) => ({
          id: item.id.toString(),
          namn: item.beskrivning || 'Okänd enhet',
          utrymmesId: utrymmesId
        }))
      };
    }

    return data;
  }
}

// Export singleton for backward compatibility
export const apiClient = new ApiClient(
  window.location.origin + '/index.php?option=com_ajax&module=fbg_fabofelanm&format=json',
  '296751',      // Default kundId
  'SERVKOMMUN'   // Default kundNr
);
