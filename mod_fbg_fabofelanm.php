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

use Joomla\CMS\Factory;
use Joomla\CMS\Helper\ModuleHelper;
use Joomla\CMS\Router\Route;
use Joomla\CMS\Uri\Uri;

// Load helper
require_once __DIR__ . '/helper.php';

// Get module parameters
$params = $module->params;

// Get current user data
$app = Factory::getApplication();
$user = $app->getIdentity();
$isLoggedIn = !$user->guest;

if (!$isLoggedIn) {
    // Show login message if user not logged in
    echo '<div class="alert alert-warning">';
    echo '<p>Du måste vara inloggad för att rapportera fel.</p>';
    echo '<a href="' . Route::_('index.php?option=com_users&view=login') . '" class="btn btn-primary">Logga in</a>';
    echo '</div>';
    return;
}

// Get user data from helper
$userData = ModFbgFabofelamnHelper::getUserData($params);

// Build API endpoint URL
$apiEndpoint = Uri::root() . 'index.php?option=com_ajax&module=fbg_fabofelanm&format=json';

// Get customer configuration
$kundId = $params->get('kund_id', '296751');
$kundNr = $params->get('kund_nr', 'SERVKOMMUN');

// Include the template
require ModuleHelper::getLayoutPath('mod_fbg_fabofelanm', $params->get('layout', 'default'));
