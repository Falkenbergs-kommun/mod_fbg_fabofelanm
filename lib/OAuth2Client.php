<?php
/**
 * OAuth2 Client for WSO2 API Gateway
 *
 * Handles OAuth2 client credentials flow for FAST2 API Gateway access
 * Tokens are cached in Joomla session for performance
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;

class OAuth2Client
{
    /**
     * OAuth2 configuration
     */
    private $tokenEndpoint;
    private $consumerKey;
    private $consumerSecret;

    /**
     * Session key for token caching
     */
    private const SESSION_KEY = 'mod_fbg_fabofelanm.oauth2_token';

    /**
     * Buffer time in seconds before token expiry to refresh
     */
    private const EXPIRY_BUFFER = 60;

    /**
     * Constructor
     *
     * @param string $tokenEndpoint OAuth2 token endpoint URL
     * @param string $consumerKey OAuth2 consumer key
     * @param string $consumerSecret OAuth2 consumer secret
     */
    public function __construct($tokenEndpoint, $consumerKey, $consumerSecret)
    {
        $this->tokenEndpoint = $tokenEndpoint;
        $this->consumerKey = $consumerKey;
        $this->consumerSecret = $consumerSecret;
    }

    /**
     * Get valid OAuth2 token (from cache or obtain new)
     *
     * @return array Token data with access_token, expires_in, etc.
     * @throws Exception if token request fails
     */
    public function getValidToken()
    {
        $app = Factory::getApplication();
        $session = $app->getSession();
        $cachedToken = $session->get(self::SESSION_KEY);

        if ($cachedToken && !$this->isTokenExpired($cachedToken)) {
            return $cachedToken;
        }

        // Token expired or not found, obtain new one
        $token = $this->obtainOAuth2Token();
        $session->set(self::SESSION_KEY, $token);

        return $token;
    }

    /**
     * Obtain OAuth2 token from WSO2
     *
     * @return array Token data
     * @throws Exception if request fails
     */
    private function obtainOAuth2Token()
    {
        $credentials = base64_encode($this->consumerKey . ':' . $this->consumerSecret);

        $ch = curl_init($this->tokenEndpoint);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Basic ' . $credentials,
                'Content-Type: application/x-www-form-urlencoded',
            ],
            CURLOPT_POSTFIELDS => 'grant_type=client_credentials',
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('OAuth2 request failed: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception('OAuth2 token request failed: ' . $httpCode . ' ' . $response);
        }

        $tokenData = json_decode($response, true);
        if (!$tokenData || !isset($tokenData['access_token'])) {
            throw new Exception('Invalid OAuth2 token response');
        }

        // Add obtained_at timestamp
        $tokenData['obtained_at'] = time();

        return $tokenData;
    }

    /**
     * Check if token is expired
     *
     * @param array|null $token Token data
     * @return bool True if expired
     */
    private function isTokenExpired($token)
    {
        if (!$token || !isset($token['obtained_at']) || !isset($token['expires_in'])) {
            return true;
        }

        $expiresAt = $token['obtained_at'] + $token['expires_in'];
        $now = time();

        return $now >= ($expiresAt - self::EXPIRY_BUFFER);
    }

    /**
     * Clear token cache
     */
    public function clearTokenCache()
    {
        $app = Factory::getApplication();
        $session = $app->getSession();
        $session->clear(self::SESSION_KEY);
    }
}
