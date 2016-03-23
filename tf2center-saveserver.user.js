// ==UserScript==
// @name       TF2Center Saved Servers
// @namespace  http://meow.tf/
// @version    1.0.1
// @description  Saves server information for easy re-use.
// @match      http://tf2center.com/lobbies
// @match      https://tf2center.com/lobbies
// @copyright  2015
// @author Nikki
// ==/UserScript==

var servers = 'savedServers' in localStorage ? JSON.parse(localStorage['savedServers']) : [];

$.fn.extend({
    unselectOptions : function() {
        $(this).children('option').each(function() {
            this.selected = false;
        });
    },
    selectOption : function(option) {
        $(this).unselectOptions();
        this.children('option[value="' + option + '"]').get(0).selected = true;
    }
});

var modalObserver = null;

var bodyObserver = attachObserver($('body').get(0), function(element) {
    return element.className == "wicket-modal";
}, function() {
    if (modalObserver) {
        modalObserver.disconnect();
        modalObserver = null;
    }
    
    modalAddedOrChanged();
});

var selectedServer = -1;

function attachObserver(obj, filter, callback) {
    var obs = new MutationObserver(function(mutations, observer) {
		for(var i = 0; i < mutations.length; i++) {
			for(var j = 0; j < mutations[i].addedNodes.length; j++) {
                if (filter(mutations[i].addedNodes[j])) {
					callback();
                }
			}
		}
	});

	obs.observe(obj, {
	  childList: true
	});
    
    return obs;
}

function modalAddedOrChanged() {
    var $hostElement = $('#hostAndPort'),
        id = $hostElement.parent().attr('id'),
        $container = $hostElement.parent().parent();
        $rconElement = $('input[name="serverPanel:manualServerContainer:manualServerPanel:form:rcon"]');
    
    if (!modalObserver) {
        modalObserver = attachObserver($container.get(0), function(element) {
            return element.id == id;
        }, modalAddedOrChanged);
    }
    
    var $savedSelect = $('<select />').addClass('ym-g1220-4 ym-gr omega'),
        $clear = $('<div />').addClass('ym-clearfix'),
        $title = $('<div class="ym-g1220-2 ym-gl field-header">Saved server:</div>'),
        $buttonTitle = $('<div class="ym-g1220-2 ym-gl field-header"></div>'),
        $saveButton = $('<button id="save-server-button" class="btn size47x32 blue">Save</button>'),
        $removeButton = $('<button id="save-remove-button" class="btn size68x32 red">Remove</button>'),
        $buttons = $('<div class="ym-g1220-3 ym-gl omega"></div>').append($saveButton, ' ', $removeButton);
    
    $savedSelect.append('<option value="clear" selected> -- select a server -- </option>');
    
    servers.forEach(function(info, index) {
        var $opt = $('<option />').val(index).text(info.host);
        if (selectedServer != -1 && selectedServer == index) {
            $savedSelect.unselectOptions();
            $opt.attr('selected', 'selected');
        }
        $savedSelect.append($opt);
    });
    
    $rconElement.after($clear.clone(), $title, $savedSelect, $clear.clone(), $buttonTitle, $buttons, $clear.clone());
    
    $saveButton.click(function(e) {
        e.preventDefault();
        
        var host = $hostElement.val(),
            password = $rconElement.val();
        
        var found = false;
        
        for (var i = 0; i < servers.length; i++) {
            if (servers[i].host == host) {
                servers[i].password = password;
                $savedSelect.selectOption(i);
                found = true;
            }
        }
        
        if (!found) {
            var index = servers.push({ host : host, password : password });
            $savedSelect.append($('<option />').val(index).text(host));
        }
        
        saveServers();
    });
    
    $removeButton.click(function(e) {
        e.preventDefault();
        
        var idx = $savedSelect.val();
        
        if (idx) {
            servers.splice(idx, 1);
            
            $savedSelect.children('option[value=' + idx + ']').remove();
        }
        
        saveServers();
    });
    
    $savedSelect.change(function() {
        selectedServer = $(this).val();
        
        if (selectedServer == 'clear') {
            selectedServer = -1;
            $hostElement.val('');
            $rconElement.val('');
            return;
        }
        
        var server = servers[selectedServer];
        
        if (server) {
            $hostElement.val(server.host);
            $rconElement.val(server.password);
        }
    });
}

function saveServers() {
    localStorage['savedServers'] = JSON.stringify(servers);
}