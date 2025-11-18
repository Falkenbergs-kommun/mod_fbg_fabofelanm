<?php
/**
 * API Authentication Client for FAST2 API
 *
 * Handles username/password login and token management for FAST2 API
 * This is separate from OAuth2 which is only for API Gateway access
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;

require_once __DIR__ . '/OAuth2Client.php';

class ApiAuthClient
{
    /**
     * Configuration
     */
    private $fast2BaseUrl;
    private $oauth2Client;
    private $username;
    private $password;

    /**
     * Session key for API token caching
     */
    private const SESSION_KEY = 'mod_fbg_fabofelanm.api_token';

    /**
     * Constructor
     *
     * @param string $fast2BaseUrl FAST2 API base URL
     * @param OAuth2Client $oauth2Client OAuth2 client instance
     * @param string $username FAST2 username
     * @param string $password FAST2 password
     */
    public function __construct($fast2BaseUrl, $oauth2Client, $username, $password)
    {
        $this->fast2BaseUrl = $fast2BaseUrl;
        $this->oauth2Client = $oauth2Client;
        $this->username = $username;
        $this->password = $password;
    }

    /**
     * Get valid API token (from cache or login)
     *
     * @return array Token data with access_token, expires_in, etc.
     * @throws Exception if login fails
     */
    public function getValidApiToken()
    {
        $app = Factory::getApplication();
        $session = $app->getSession();
        $cachedToken = $session->get(self::SESSION_KEY);

        if ($cachedToken && !$this->isApiTokenExpired($cachedToken)) {
            return $cachedToken;
        }

        // Token expired or not found, login again
        $token = $this->loginToApi();
        $session->set(self::SESSION_KEY, $token);

        return $token;
    }

    /**
     * Login to FAST2 API with username/password
     * Requires OAuth2 token for API Gateway access
     *
     * @return array Token data
     * @throws Exception if login fails
     */
    private function loginToApi()
    {
        // Step 1: Get OAuth2 token for API Gateway
        $oauth2Token = $this->oauth2Client->getValidToken();

        // Step 2: Login with username/password using OAuth2 token
        $loginUrl = $this->fast2BaseUrl . '/ao-produkt/v1/auth/login';

        $ch = curl_init($loginUrl);
        curl_setopt_array($ch, [
            CURLOPT_POST => true,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_HTTPHEADER => [
                'Authorization: Bearer ' . $oauth2Token['access_token'],
                'Content-Type: application/json',
            ],
            CURLOPT_POSTFIELDS => json_encode([
                'username' => $this->username,
                'password' => $this->password,
            ]),
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);

        if ($error) {
            throw new Exception('API login request failed: ' . $error);
        }

        if ($httpCode !== 200) {
            throw new Exception('API login failed: ' . $httpCode . ' ' . $response);
        }

        $tokenData = json_decode($response, true);
        if (!$tokenData || !isset($tokenData['access_token'])) {
            throw new Exception('Invalid API token response');
        }

        // Add obtained_at timestamp
        $tokenData['obtained_at'] = time();

        return $tokenData;
    }

    /**
     * Check if API token is expired
     *
     * @param array|null $token Token data
     * @return bool True if expired
     */
    private function isApiTokenExpired($token)
    {
        if (!$token || !isset($token['obtained_at']) || !isset($token['expires_in'])) {
            return true;
        }

        $expiresAt = $token['obtained_at'] + $token['expires_in'];
        $now = time();

        return $now >= $expiresAt;
    }

    /**
     * Clear API token cache
     */
    public function clearApiTokenCache()
    {
        $app = Factory::getApplication();
        $session = $app->getSession();
        $session->clear(self::SESSION_KEY);
    }
}
