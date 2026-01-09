<?php
/**
 * API Logger for FAST2 API requests
 *
 * Logs API requests and responses to file for debugging
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;

class ApiLogger
{
    private $enabled;
    private $logDirectory;
    private $logFile;

    /**
     * Constructor
     *
     * @param bool $enabled Whether logging is enabled
     * @param string $logDirectory Directory to save log files
     */
    public function __construct($enabled = false, $logDirectory = null)
    {
        $this->enabled = $enabled;
        $this->logDirectory = $logDirectory ?: '/tmp';

        // Create log file name with date
        $date = date('Y-m-d');
        $this->logFile = rtrim($this->logDirectory, '/') . "/api_log_{$date}.log";

        // Ensure directory exists
        if ($this->enabled && !is_dir($this->logDirectory)) {
            @mkdir($this->logDirectory, 0755, true);
        }
    }

    /**
     * Log an API request and response
     *
     * @param string $path API path
     * @param string $method HTTP method
     * @param mixed $requestBody Request payload
     * @param array $response API response
     * @param string|null $username Joomla username
     */
    public function logRequest($path, $method, $requestBody, $response, $username = null)
    {
        if (!$this->enabled) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');

        // Get current user if not provided
        if ($username === null) {
            try {
                $user = Factory::getUser();
                $username = $user->username ?: 'guest';
            } catch (Exception $e) {
                $username = 'unknown';
            }
        }

        // Prepare log entry
        $logEntry = [
            'timestamp' => $timestamp,
            'user' => $username,
            'method' => $method,
            'path' => $path,
            'request' => $this->sanitizeForLog($requestBody),
            'response_status' => $response['status'] ?? 'N/A',
            'response_data' => $this->sanitizeForLog($response['data'] ?? null),
        ];

        // Format as readable JSON
        $logLine = json_encode($logEntry, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        $logLine = str_repeat('-', 80) . "\n" . $logLine . "\n";

        // Write to file
        $this->writeToFile($logLine);
    }

    /**
     * Sanitize sensitive data from logs
     *
     * @param mixed $data Data to sanitize
     * @return mixed Sanitized data
     */
    private function sanitizeForLog($data)
    {
        if (is_array($data)) {
            // Remove sensitive fields
            $sensitiveKeys = ['password', 'access_token', 'refresh_token', 'consumer_secret'];

            foreach ($sensitiveKeys as $key) {
                if (isset($data[$key])) {
                    $data[$key] = '***REDACTED***';
                }
            }

            // Recursively sanitize nested arrays
            foreach ($data as $key => $value) {
                if (is_array($value)) {
                    $data[$key] = $this->sanitizeForLog($value);
                }
            }
        }

        // Handle file uploads - don't log binary data
        if ($data instanceof CURLFile) {
            return [
                'type' => 'FILE_UPLOAD',
                'name' => $data->getPostFilename(),
                'mime' => $data->getMimeType(),
            ];
        }

        return $data;
    }

    /**
     * Write log line to file
     *
     * @param string $line Log line to write
     */
    private function writeToFile($line)
    {
        try {
            // Append to file with file locking
            $handle = @fopen($this->logFile, 'a');
            if ($handle) {
                flock($handle, LOCK_EX);
                fwrite($handle, $line);
                flock($handle, LOCK_UN);
                fclose($handle);

                // Set file permissions
                @chmod($this->logFile, 0644);
            }
        } catch (Exception $e) {
            // Silently fail - logging should never break the application
        }
    }

    /**
     * Log an error
     *
     * @param string $message Error message
     * @param Exception|null $exception Optional exception
     */
    public function logError($message, $exception = null)
    {
        if (!$this->enabled) {
            return;
        }

        $timestamp = date('Y-m-d H:i:s');

        $logEntry = [
            'timestamp' => $timestamp,
            'type' => 'ERROR',
            'message' => $message,
        ];

        if ($exception) {
            $logEntry['exception'] = [
                'message' => $exception->getMessage(),
                'file' => $exception->getFile(),
                'line' => $exception->getLine(),
            ];
        }

        $logLine = str_repeat('=', 80) . "\n";
        $logLine .= json_encode($logEntry, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE);
        $logLine .= "\n";

        $this->writeToFile($logLine);
    }
}
