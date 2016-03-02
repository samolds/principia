// this is for updating tabs for the properties window
$(document).ready(function(){
  $('ul.tabs').tabs('select_tab', 'tab_id');
});

function displayTooltips() {
  var tooltipToggle = $('#help-tooltips').children();

  if (tooltipToggle.hasClass('fa-question')) {
    // Scroll to 20px above the tooltip toggle
    window.scroll(0, (tooltipToggle.position().top - 50))

    $('#toolbox-tab').click();
    $('#help-tooltip-simulator').show();
    $('#help-tooltip-properties').show();
    $('#help-tooltip-toolbox').show();
    $('#help-tooltip-play').show();
    tooltipToggle.removeClass('fa-question');
    tooltipToggle.addClass('fa-times');
  } else {
    $('#help-tooltip-simulator').hide();
    $('#help-tooltip-properties').hide();
    $('#help-tooltip-toolbox').hide();
    $('#help-tooltip-play').hide();
    tooltipToggle.removeClass('fa-times');
    tooltipToggle.addClass('fa-question');
  }
}
