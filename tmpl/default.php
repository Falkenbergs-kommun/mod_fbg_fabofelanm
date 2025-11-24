<?php
/**
 * Default template for Felanmälan Module
 *
 * Loads React widget and initializes with user data
 *
 * @package    Falkenbergs kommun
 * @subpackage mod_fbg_fabofelanm
 */

defined('_JEXEC') or die;

use Joomla\CMS\Factory;
use Joomla\CMS\Uri\Uri;

// Load module assets
$app = Factory::getApplication();
$document = $app->getDocument();
$moduleBase = Uri::root(true) . '/modules/mod_fbg_fabofelanm';

// UIkit 3 is loaded by Joomla template, but we ensure it's loaded
// Most Joomla templates include UIkit, but if needed, uncomment:
// $document->addStyleSheet('https://cdn.jsdelivr.net/npm/uikit@3.21.0/dist/css/uikit.min.css');
// $document->addScript('https://cdn.jsdelivr.net/npm/uikit@3.21.0/dist/js/uikit.min.js');
// $document->addScript('https://cdn.jsdelivr.net/npm/uikit@3.21.0/dist/js/uikit-icons.min.js');

// Load minimal custom widget styles
$document->addStyleSheet($moduleBase . '/assets/css/felanmalan-widget.css');

// Load React widget JavaScript
$document->addScript($moduleBase . '/assets/js/felanmalan-widget.js');

// Prepare user data for JavaScript
$userDataJson = json_encode($userData);
$apiEndpointJson = json_encode($apiEndpoint);
$kundIdJson = json_encode($kundId);
$kundNrJson = json_encode($kundNr);

// Module class suffix
$moduleclass_sfx = htmlspecialchars($params->get('moduleclass_sfx', ''));
?>

<div id="mod-fbg-fabofelanm-<?php echo $module->id; ?>" class="mod-fbg-fabofelanm<?php echo $moduleclass_sfx; ?>">
    <div id="felanmalan-container-<?php echo $module->id; ?>">
        <div style="padding: 2rem; text-align: center;">
            <p>Laddar felanmälan...</p>
        </div>
    </div>
</div>

<script>
(function() {
    var maxRetries = 50; // 5 seconds max
    var retryCount = 0;

    // Wait for FelanmalanWidget to be loaded
    function initWidget() {
        if (typeof window.FelanmalanWidget !== 'undefined') {
            try {
                window.FelanmalanWidget.init({
                    containerId: 'felanmalan-container-<?php echo $module->id; ?>',
                    apiEndpoint: <?php echo $apiEndpointJson; ?>,
                    userData: <?php echo $userDataJson; ?>,
                    kundId: <?php echo $kundIdJson; ?>,
                    kundNr: <?php echo $kundNrJson; ?>
                });
            } catch (error) {
                console.error('Error initializing widget:', error);
            }
        } else {
            retryCount++;
            if (retryCount < maxRetries) {
                // Retry after a short delay
                setTimeout(initWidget, 100);
            } else {
                console.error('FelanmalanWidget failed to load after ' + maxRetries + ' retries');
                document.getElementById('felanmalan-container-<?php echo $module->id; ?>').innerHTML =
                    '<div style="padding: 2rem; text-align: center; color: red;"><p>Fel: Kunde inte ladda felanmälan. Kontrollera konsollen för detaljer.</p></div>';
            }
        }
    }

    // Initialize when DOM is ready
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initWidget);
    } else {
        initWidget();
    }
})();
</script>
