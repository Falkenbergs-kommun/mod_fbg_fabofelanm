<?php
/**
 * Felanmälan Module for Falkenbergs kommun
 *
 * Embeds React-based fault reporting widget with FAST2 API integration
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

// Load helper
require_once __DIR__ . '/helper.php';

// Get module parameters
$params = $module->params;

// Get current user data
$user = JFactory::getUser();
$isLoggedIn = !$user->guest;

if (!$isLoggedIn) {
    // Show login message if user not logged in
    echo '<div class="alert alert-warning">';
    echo '<p>Du måste vara inloggad för att rapportera fel.</p>';
    echo '<a href="' . JRoute::_('index.php?option=com_users&view=login') . '" class="btn btn-primary">Logga in</a>';
    echo '</div>';
    return;
}

// Get user data from helper
$userData = ModFbgFabofelamnHelper::getUserData($params);

// Build API endpoint URL
$apiEndpoint = JUri::root() . 'index.php?option=com_ajax&module=fbg_fabofelanm&format=json';

// Get Google Maps API key (optional)
$googleMapsApiKey = $params->get('google_maps_api_key', '');

// Include the template
require JModuleHelper::getLayoutPath('mod_fbg_fabofelanm', $params->get('layout', 'default'));
