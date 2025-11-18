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

// Load module assets
$document = JFactory::getDocument();
$moduleBase = JUri::root(true) . '/modules/mod_fbg_fabofelanm';

// Load React widget CSS
$document->addStyleSheet($moduleBase . '/assets/css/felanmalan-widget.css');

// Load React widget JavaScript
$document->addScript($moduleBase . '/assets/js/felanmalan-widget.js', [], ['defer' => true]);

// Get customer number from params
$kundNr = $params->get('kund_nr', 'SERVAKOMMUN');

// Prepare user data for JavaScript
$userDataJson = json_encode($userData);
$apiEndpointJson = json_encode($apiEndpoint);
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
    // Wait for FelanmalanWidget to be loaded
    function initWidget() {
        if (typeof window.FelanmalanWidget !== 'undefined') {
            window.FelanmalanWidget.init({
                containerId: 'felanmalan-container-<?php echo $module->id; ?>',
                apiEndpoint: <?php echo $apiEndpointJson; ?>,
                userData: <?php echo $userDataJson; ?>,
                kundNr: <?php echo $kundNrJson; ?>
            });
        } else {
            // Retry after a short delay
            setTimeout(initWidget, 100);
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
