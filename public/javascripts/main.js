(function ($) {
    "use strict";

    function moveTo(button, value) {
        let id = button.getAttribute("value")
        $.ajax({
            url: `http://localhost:8080/properties/${id}`,
            type: 'PUT',
            data: {
                state: value
            },
            success: function () {
                changeRowState(button)
            }
        });
    }

    function moveToHidden(button) {
        let id = button.getAttribute("value")
        $.ajax({
            url: `http://localhost:8080/properties/${id}`,
            type: 'DELETE',
            success: function () {
                changeRowState(button);
            }
        });
    }

    function showEditModal(button) {
        let id = button.getAttribute("value")
        let value = $(button).data("notes")
        $("#notes-edit-text").val(value);
        $("#modal-check").data("id", id);
        $("#notesModal").css("display", "block");
    }

    function updateNotes(button) {
        let id = $(button).data("id");
        let notes = $("#notes-edit-text").val();
        $("#notes-edit-text").val("");
        $("#modal-check").data("id", "");
        $("#notesModal").css("display", "none");
        $.ajax({
            url: `http://localhost:8080/properties/${id}`,
            type: 'PUT',
            data: {
                notes: notes
            },
            success: function () {
                $(`#${id} #notes-icon`).css("color", "blue");
                $(`#${id} #notes-icon`).attr("title", notes);
                $(`#${id} #notes-icon`).data("notes", notes);
            }
        });
    }

    function closeEditModal() {
        $("#notesModal").css("display", "none");
    }

    function changeRowState(button) {
        let id = button.getAttribute("value")
        if ($("body").data("current-state") != "all") {
            $(`#${id}`).fadeOut("normal", function () {
                $(this).remove();
            });
        } else {
            $(`#${id} .only-one`).css("color", "");
            let color = $(button).data("color")
            $(button).css("color", color);
        }
    }

    $(window).click(function (e) {
        if ($(e.target).is($("#notesModal"))) {
            closeEditModal();
        }
    });

    function initMap() {
        const pageNum = $("body").data("current-page")
        const state = $("body").data("current-state")
        $.ajax({
            url: `http://localhost:8080/properties/${state}/page-${pageNum}`,
            type: 'GET',
            success: function (results) {

                if (results && results.count && results.count > 0 && results.properties && results.center) {
                    var centerOfBounds = {
                        lat: results.center.latitude,
                        lng: results.center.longitude
                    };
                    var map = new google.maps.Map(document.getElementById('map'), {
                        zoom: 12,
                        center: centerOfBounds
                    });

                    let infoWindow = new google.maps.InfoWindow;
                    for (let i = 0; i < results.properties.length; i++) {
                        let contentString = '<div id="content">' +
                            '<div id="siteNotice">' +
                            '</div>' +
                            `<h5><a target="_blank" href="${results.properties[i].url}">${results.properties[i].name}</a></h5>` +
                            `<div style="margin:10px;" id="${results.properties[i].id}">` +
                            '<ul>' +
                            `<li>${results.properties[i].price.toLocaleString('en-NL', {
								style: 'currency',
								currency: 'EUR',
								minimumFractionDigits: 0,
    							maximumFractionDigits: 0
							  })}</li>` +
                            `<li>${results.properties[i].surfaceArea}m²</li>` +
                            `<li>${results.properties[i].bedrooms} Bedrooms</li>` +
                            `<li>${results.properties[i].furniture}</li>` +
                            `<li>${results.properties[i].neighborhood}</li>` +
                            `<li>Distance: <a target="_blank" href="${results.properties[i].locationUrl}">${(results.properties[i].distance/1000).toFixed(1)} Km</a></li>` +
                            `<li>Commute: <a target="_blank" href="${results.properties[i].navigation}">${Math.floor(results.properties[i].duration / 60)}m</a></li>` +
                            `<li style="margin-top:10px">` +
                            `<i class="material-icons" id="notes-icon"` +
                            `title="${results.properties[i].notes && results.properties[i].notes.length>0 ? results.properties[i].notes : 'Add notes'}"` +
                            `data-color="blue" data-notes="${results.properties[i].notes?results.properties[i].notes:''}"` +
                            `style="${results.properties[i].notes && results.properties[i].notes.length>0 ? 'color:blue;' : '' }"` +
                            `value="${results.properties[i].id}" onclick="showEditModal(this)">notes</i>` +
                            (state != 'interesting' ? `<i class="material-icons only-one" title="Add to the interesting list" data-color="orange"` +
                                `style="${results.properties[i].state=='interesting'? 'color:orange;' : ''}"` +
                                `value="${results.properties[i].id}" onclick="moveTo(this,'interesting')">grade</i>` : '') +
                            (state != 'new' ? `<i class="material-icons only-one" title="Move back to new list" data-color="violet"` +
                                `style="${results.properties[i].state=='new'? 'color:violet;' : ''}"` +
                                `value="${results.properties[i].id}" onclick="moveTo(this,'new')">fiber_new</i>` : '') +
                            (state != 'shortlisted' ? `<i class="material-icons only-one" title="Add to the shortlist" data-color="green"` +
                                `style="${results.properties[i].state=='shortlisted'? 'color:green;' : ''}"` +
                                `value="${results.properties[i].id}" onclick="moveTo(this,'shortlisted')">favorite</i>` : '') +
                            (state != 'hidden' ? `<i class="material-icons only-one" title="Hide permanently" data-color="red"` +
                                `style="${results.properties[i].state=='hidden'? 'color:red;' : ''}"` +
                                `value="${results.properties[i].id}" onclick="moveToHidden(this)">delete</i>` : '') +
                            `</li>` +
                            '</ul>' +
                            '</div>' +
                            '</div>';

                        let marker = new google.maps.Marker({
                            position: results.properties[i].coordinates,
                            map: map,
                            title: results.properties[i].name
                        });
                        marker.addListener('click', function () {
                            infoWindow.setContent(contentString);
                            infoWindow.open(map, marker);
                        });
                    }

                }
            }
        });
    }

    window.moveToHidden = moveToHidden;
    window.initMap = initMap;
    window.moveTo = moveTo;
    window.showEditModal = showEditModal;
    window.closeEditModal = closeEditModal;
    window.updateNotes = updateNotes;
})(jQuery);