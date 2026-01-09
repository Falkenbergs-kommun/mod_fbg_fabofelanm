<?php
/**
 * Helper class for Felanmälan BFF Module
 *
 * Implements Backend for Frontend (BFF) pattern for FAST2 API
 * - Handles authentication (OAuth2 + API token)
 * - Proxies requests to FAST2 API
 * - Filters confidential work orders
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\ModuleHelper;
use Joomla\Registry\Registry;

require_once __DIR__ . '/lib/ProxyToRealApi.php';
require_once __DIR__ . '/lib/ApiLogger.php';

class ModFbgFabofelanmHelper
{
    /**
     * Clear all cached authentication tokens and force re-login
     * Call: index.php?option=com_ajax&module=fbg_fabofelanm&method=clearAuthCache&format=json
     *
     * @return array Response data
     */
    public static function getAjaxClearAuthCache()
    {
        $app = Factory::getApplication();
        $session = $app->getSession();

        // Clear OAuth2 token cache
        $session->clear('mod_fbg_fabofelanm.oauth2_token');

        // Clear API token cache
        $session->clear('mod_fbg_fabofelanm.api_token');

        return [
            'success' => true,
            'message' => 'Authentication cache cleared. Next request will trigger fresh login.',
        ];
    }

    /**
     * AJAX proxy handler - Joomla 3/4 style
     * Called via: index.php?option=com_ajax&module=fbg_fabofelanm&method=proxy&format=json
     *
     * @return array Response data
     */
    public static function getAjaxProxy()
    {
        return self::proxyAjax();
    }

    /**
     * AJAX proxy handler - Joomla 5 style
     * Called via: index.php?option=com_ajax&module=fbg_fabofelanm&method=proxy&format=json
     *
     * @return array Response data
     */
    public static function proxyAjax()
    {
        // Get request parameters
        $app = Factory::getApplication();
        $input = $app->input;

        $path = $input->getString('path', '');
        $httpMethod = $input->getString('http_method', 'GET');

        // Validate path
        if (empty($path)) {
            return [
                'success' => false,
                'error' => 'Missing path parameter',
            ];
        }

        // Get request body for POST/PUT
        $body = null;
        if ($httpMethod === 'POST' || $httpMethod === 'PUT') {
            $contentType = $input->server->getString('CONTENT_TYPE', '');

            if (strpos($contentType, 'multipart/form-data') !== false) {
                // Handle file upload
                $files = $input->files->get('file');
                if ($files) {
                    // Convert uploaded file to CURLFile
                    $tmpName = $files['tmp_name'];
                    $name = $files['name'];
                    $type = $files['type'];
                    $body = ['file' => new CURLFile($tmpName, $type, $name)];
                }
            } else {
                // Get JSON body
                $rawBody = file_get_contents('php://input');
                if (!empty($rawBody)) {
                    $body = json_decode($rawBody, true);
                }
            }
        }

        try {
            // Get module parameters
            $module = ModuleHelper::getModule('mod_fbg_fabofelanm');
            $params = new Registry($module->params);

            // Get API configuration
            $fast2BaseUrl = $params->get('fast2_base_url', '');
            $oauth2Endpoint = $params->get('oauth2_token_endpoint', '');
            $consumerKey = $params->get('consumer_key', '');
            $consumerSecret = $params->get('consumer_secret', '');
            $username = $params->get('username', '');
            $password = $params->get('password', '');

            // Validate configuration
            if (empty($fast2BaseUrl) || empty($consumerKey) || empty($consumerSecret)) {
                return [
                    'success' => false,
                    'error' => 'Module not configured. Please set FAST2 API credentials.',
                ];
            }

            // If oauth2 endpoint not configured, use default
            if (empty($oauth2Endpoint)) {
                $oauth2Endpoint = $fast2BaseUrl . '/oauth2/token';
            }

            // Initialize logger if enabled
            $enableLogging = $params->get('enable_logging', 0);
            $logDirectory = $params->get('log_directory', '/home/httpd/fbg-intranet/joomlaextensions/fabofelanm/fabo_test');
            $logger = new ApiLogger($enableLogging == 1, $logDirectory);

            // Create proxy instance
            $proxy = new ProxyToRealApi(
                $fast2BaseUrl,
                $oauth2Endpoint,
                $consumerKey,
                $consumerSecret,
                $username,
                $password,
                $logger
            );

            // Proxy the request
            $response = $proxy->proxyRequest($path, $httpMethod, $body);

            // Filter out confidential work orders from list responses
            if ($httpMethod === 'GET' && strpos($path, '/arbetsorder') !== false && is_array($response['data'])) {
                $response['data'] = self::filterConfidentialWorkOrders($response['data']);
            }

            return [
                'success' => true,
                'status' => $response['status'],
                'data' => $response['data'],
            ];

        } catch (Exception $e) {
            return [
                'success' => false,
                'error' => $e->getMessage(),
            ];
        }
    }

    /**
     * Filter out confidential work orders from array
     *
     * @param array $workOrders Array of work orders
     * @return array Filtered array
     */
    private static function filterConfidentialWorkOrders($workOrders)
    {
        return array_filter($workOrders, function($workOrder) {
            return !isset($workOrder['externtNr']) || $workOrder['externtNr'] !== 'CONFIDENTIAL';
        });
    }

    /**
     * Get user data from Joomla session
     *
     * @param JRegistry $params Module parameters
     * @return array User data (name, email, phone)
     */
    public static function getUserData($params)
    {
        $app = Factory::getApplication();
        $user = $app->getIdentity();

        // Get field mappings from module parameters
        $nameField = $params->get('user_name_field', 'name');
        $emailField = $params->get('user_email_field', 'email');
        $phoneField = $params->get('user_phone_field', 'profile.mobil');

        // Get user data
        $userData = [
            'name' => self::getUserField($user, $nameField),
            'email' => self::getUserField($user, $emailField),
            'phone' => self::getUserField($user, $phoneField),
        ];

        return $userData;
    }

    /**
     * Get user field value (supports nested fields like profile.mobil)
     *
     * @param JUser $user Joomla user object
     * @param string $fieldPath Field path (e.g., 'name' or 'profile.mobil')
     * @return string Field value
     */
    private static function getUserField($user, $fieldPath)
    {
        // If it's a profile field, fetch from database
        if (strpos($fieldPath, 'profile.') === 0) {
            return self::getUserProfileValue($user->id, $fieldPath);
        }

        // Otherwise, get directly from user object
        $parts = explode('.', $fieldPath);
        $value = $user;

        foreach ($parts as $part) {
            if (is_object($value) && isset($value->$part)) {
                $value = $value->$part;
            } elseif (is_array($value) && isset($value[$part])) {
                $value = $value[$part];
            } else {
                return '';
            }
        }

        return (string) $value;
    }

    /**
     * Get user profile value from database
     *
     * @param int $userId User ID
     * @param string $profileKey Profile key (e.g., 'profile.mobil')
     * @return string Profile value or empty string
     */
    private static function getUserProfileValue($userId, $profileKey)
    {
        $db = Factory::getDbo();
        $query = $db->getQuery(true);

        $query->select($db->quoteName('profile_value'))
            ->from($db->quoteName('#__user_profiles'))
            ->where($db->quoteName('user_id') . ' = ' . (int) $userId)
            ->where($db->quoteName('profile_key') . ' = ' . $db->quote($profileKey));

        $db->setQuery($query);

        try {
            $result = $db->loadResult();

            if (!$result) {
                return '';
            }

            // Joomla stores profile values as JSON-encoded strings
            $decoded = json_decode($result);
            return $decoded !== null ? (string) $decoded : $result;
        } catch (Exception $e) {
            return '';
        }
    }
}
