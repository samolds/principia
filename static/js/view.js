// this is for updating tabs for the properties window
$(document).ready(function(){
  $('ul.tabs').tabs('select_tab', 'tab_id');
});

function displayTooltips() {
  window.location.hash = '#help-tooltips';

  if ($('#help-tooltip-simulator').css('display') === 'none') {
    $('#help-tooltip-simulator').show();
    $('#help-tooltip-properties').show();
    $('#toolbox-tab').click();
    $('#help-tooltip-toolbox').show();
    $('#help-tooltip-play').show();
  } else {
    $('#help-tooltip-simulator').hide();
    $('#help-tooltip-properties').hide();
    $('#help-tooltip-toolbox').hide();
    $('#help-tooltip-play').hide();
  }
}
