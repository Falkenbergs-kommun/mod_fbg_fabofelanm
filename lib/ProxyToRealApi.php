<?php
/**
 * BFF Proxy to Real FAST2 API
 *
 * Routes requests to real FAST2 API with two-tier authentication:
 * 1. OAuth2 for API Gateway (WSO2)
 * 2. API token from username/password login for actual API calls
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

require_once __DIR__ . '/OAuth2Client.php';
require_once __DIR__ . '/ApiAuthClient.php';

class ProxyToRealApi
{
    private $fast2BaseUrl;
    private $oauth2Client;
    private $apiAuthClient;

    /**
     * Constructor
     *
     * @param string $fast2BaseUrl FAST2 API base URL
     * @param string $oauth2TokenEndpoint OAuth2 token endpoint
     * @param string $consumerKey OAuth2 consumer key
     * @param string $consumerSecret OAuth2 consumer secret
     * @param string $username FAST2 username
     * @param string $password FAST2 password
     */
    public function __construct(
        $fast2BaseUrl,
        $oauth2TokenEndpoint,
        $consumerKey,
        $consumerSecret,
        $username,
        $password
    ) {
        $this->fast2BaseUrl = $fast2BaseUrl;
        $this->oauth2Client = new OAuth2Client($oauth2TokenEndpoint, $consumerKey, $consumerSecret);
        $this->apiAuthClient = new ApiAuthClient($fast2BaseUrl, $this->oauth2Client, $username, $password);
    }

    /**
     * Proxy a request to the real FAST2 API
     *
     * @param string $path API path (e.g., /ao-produkt/v1/arbetsorder)
     * @param string $method HTTP method (GET, POST, PUT, DELETE)
     * @param mixed $body Request body (array for JSON, or raw data for multipart)
     * @return array Response with 'status', 'headers', and 'data'
     * @throws Exception if request fails
     */
    public function proxyRequest($path, $method, $body = null)
    {
        // Try the request
        $response = $this->makeRequest($path, $method, $body);

        // If authentication failed, clear both token caches and retry once
        if ($this->isAuthError($response)) {
            $this->oauth2Client->clearTokenCache();
            $this->apiAuthClient->clearApiTokenCache();
            $response = $this->makeRequest($path, $method, $body);
        }

        return $response;
    }

    /**
     * Make the actual API request
     *
     * @param string $path API path
     * @param string $method HTTP method
     * @param mixed $body Request body
     * @return array Response data
     * @throws Exception if request fails
     */
    private function makeRequest($path, $method, $body)
    {
        $url = $this->fast2BaseUrl . $path;

        // Step 1: Get OAuth2 token (required for API Gateway)
        $oauth2Token = $this->oauth2Client->getValidToken();

        // Build headers with OAuth2 Bearer token
        $headers = [
            'Authorization: Bearer ' . $oauth2Token['access_token'],
        ];

        // Step 2: For non-auth endpoints, also get and add X-Auth-Token
        if (!$this->isAuthEndpoint($path)) {
            $apiToken = $this->apiAuthClient->getValidApiToken();
            $headers[] = 'X-Auth-Token: ' . $apiToken['access_token'];
        }

        // Initialize cURL
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_HEADER, true);

        // Set method
        switch (strtoupper($method)) {
            case 'GET':
                // Default
                break;
            case 'POST':
                curl_setopt($ch, CURLOPT_POST, true);
                break;
            case 'PUT':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
                break;
            case 'DELETE':
                curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'DELETE');
                break;
            default:
                throw new Exception('Unsupported HTTP method: ' . $method);
        }

        // Handle request body
        if ($body && ($method === 'POST' || $method === 'PUT')) {
            if ($body instanceof CURLFile || is_array($body) && $this->isMultipartData($body)) {
                // For file uploads, let cURL handle multipart
                curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
                // Don't set Content-Type header for multipart, cURL handles it
            } else {
                // For JSON requests
                $headers[] = 'Content-Type: application/json';
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($body));
            }
        }

        // Set headers
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);

        // Execute request
        $response = curl_exec($ch);
        $error = curl_error($ch);

        if ($error) {
            curl_close($ch);
            throw new Exception('API request failed: ' . $error);
        }

        // Parse response
        $headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);

        $responseHeaders = substr($response, 0, $headerSize);
        $responseBody = substr($response, $headerSize);

        // Parse response body
        $data = null;
        if (!empty($responseBody)) {
            $decoded = json_decode($responseBody, true);
            $data = $decoded !== null ? $decoded : $responseBody;
        }

        return [
            'status' => $httpCode,
            'headers' => $this->parseHeaders($responseHeaders),
            'data' => $data,
        ];
    }

    /**
     * Check if path is an auth endpoint (use OAuth2 only)
     *
     * @param string $path API path
     * @return bool
     */
    private function isAuthEndpoint($path)
    {
        return strpos($path, '/auth/login') !== false
            || strpos($path, '/auth/refresh') !== false
            || strpos($path, '/auth/logout') !== false
            || strpos($path, '/auth/loginsso') !== false;
    }

    /**
     * Check if response indicates authentication failure
     *
     * @param array $response Response data
     * @return bool
     */
    private function isAuthError($response)
    {
        if ($response['status'] === 401 || $response['status'] === 403) {
            return true;
        }

        $body = is_string($response['data']) ? $response['data'] : json_encode($response['data']);
        return strpos($body, 'Invalid JWT token') !== false
            || strpos($body, 'Invalid Credentials') !== false
            || strpos($body, '900901') !== false;
    }

    /**
     * Check if data is multipart (contains file uploads)
     *
     * @param mixed $data Request data
     * @return bool
     */
    private function isMultipartData($data)
    {
        if (!is_array($data)) {
            return false;
        }

        foreach ($data as $value) {
            if ($value instanceof CURLFile) {
                return true;
            }
        }

        return false;
    }

    /**
     * Parse HTTP headers from response
     *
     * @param string $headerString Raw headers
     * @return array Parsed headers
     */
    private function parseHeaders($headerString)
    {
        $headers = [];
        $lines = explode("\r\n", $headerString);

        foreach ($lines as $line) {
            if (strpos($line, ':') !== false) {
                list($key, $value) = explode(':', $line, 2);
                $headers[strtolower(trim($key))] = trim($value);
            }
        }

        return $headers;
    }
}
