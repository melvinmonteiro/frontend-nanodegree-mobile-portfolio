    //Constants used in the application for manhattan latitude and longitude.
    var MANHATTAN_NEW_YORK_CITY_LAT = 40.7831;
    var MANHATTAN_NEW_YORK_CITY_LONG = -73.9712;
    /*
     * A Place Model that represents a museum
     */
    var Place = function(id, name ,location) {
        //google place id. we use this as a data attribute.
        this.id = id;
        //name of the museum
        this.name = name;
        //location co-ordinates of the musuem.
        this.location = location;
        //google marker object.
        this.marker = undefined;
        //related wikipedia links. will have attributes of 'title' and 'url'
        this.relatedWikiLinks = ko.observableArray([]);
        //loadingWikiLinks is used for animation while the related links are being loaded.
        this.loadingWikiLinks = ko.observable(false);
    };

    /* this binding is used so that the places list is in view when the marker is clicked.
     * http://stackoverflow.com/questions/20740212/knockoutjs-scrollintoviewtrigger
    */
    ko.bindingHandlers.scrollTo = {
        update: function (element, valueAccessor, allBindings) {
            var _value = valueAccessor();
            var _valueUnwrapped = ko.unwrap(_value);
            if (_valueUnwrapped) {
                element.scrollIntoView();
            }
        }
    };

    /* the view model object for the application
     */
    var PlacesViewModel = function() {

        var self = this;
        //for filtering the places
        self.filter = ko.observable('');

        //a array to hold the places.
        self.places = ko.observableArray([]);

        /* these 2 set of observables are used for the place list button
        */
        self.togglePlacesListBoolean = ko.observable(false);
        self.togglePlacesDisplayText = ko.observable("Hide Place List");

        //we set the scroll item when the marker is clicked
        self.scrolledItem = ko.observable();

        /**
            toggle hide/show 'hide-sidebar' css class
        */
        self.togglePlacesList = function() {
            (self.togglePlacesDisplayText() === "Show Place List")
                ? self.togglePlacesDisplayText("Hide Place List") : self.togglePlacesDisplayText("Show Place List");
            return self.togglePlacesListBoolean(!self.togglePlacesListBoolean());
        };

        /**
            add places to the places observable
        */
        self.addPlace = function(place) {
            self.places.push(place);
            //create the google marker
            place.marker = new google.maps.Marker({
                  map: map,
                  position: place.location
                });

            //associate events listener on the marker on click
            google.maps.event.addListener(place.marker, 'click', function() {
                 //we update the scroll item. this is used in the index.html to bind a scroll event.
                 self.scrolledItem(place);
                 //for now we only set the content to the place name
                 //infowindow is a global variable
                 infowindow.setContent(place.name);
                 infowindow.open(map, this);

                 //show loading wiki links
                 place.loadingWikiLinks(true);

                 //animated the marker
                 place.marker.setAnimation(google.maps.Animation.BOUNCE);
                 //pan to the marker position
                 map.panTo(place.marker.getPosition());
                 //set a little zoom
                 map.setZoom(14);
                 //set to center
                 map.setCenter(place.marker.getPosition());

                 //make a ajax call to show related wiki links on click of marker
                 //the set timeout is just used to demonstrate the loading animation based on knockout
                 setTimeout(function(){
                        self.showWikiInfo(place);
                     }, 1000);
             });
        };

        /**
            this function will call the wiki api to get related links.
         */
        self.showWikiInfo = function(place) {
            var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +place.name + '&format=json&callback=wikiCallback';
            $.ajax({
                     url: wikiUrl,
                     dataType: "jsonp"
                 })
                 .done(function(response) {
                     //we empty the wiki links if they were previously loaded
                     place.relatedWikiLinks([]);
                     var infoWindowContent;
                     if (response[1] !== undefined && response[1].length > 0 ) {
                         for (var i = 0 ; i < response[1].length ; i++ ) {
                             place.relatedWikiLinks.push({title:response[1][i],url:response[3][i]});
                         }
                         //build a html to show on the content info panel
                         infoWindowContent = "<h5>"+place.name+"</h5>"+
                                        "<h6>Related Links</h6>"+
                                        "<ul>";
                         place.relatedWikiLinks().forEach(function(wikiLink) {
                            infoWindowContent += "<li> <a href='"+wikiLink.url+"' target='_blank'>"+wikiLink.title+"</a></li>";
                         });
                         infoWindowContent += "</ul>";
                     }
                     else { //if no related links then show below message
                         infoWindowContent = "<h5>"+place.name+"</h5>"+
                                         "<h6>No Related Link found for this museum</h6>"+
                                         "<ul>";
                     }
                     infowindow.setContent(infoWindowContent);
                     //disable the animation
                     place.loadingWikiLinks(false);
                     //remove the animation
                     place.marker.setAnimation(null);
                 })
                 .fail(function(jqXHR, textStatus) {
                       //console.log("error while making javascript api");
                       var errorContainer = document.querySelector('#error-snackbar');
                       var data = {
                             message: 'Error while making api call to wikipedia`',
                             timeout: 2000
                           };
                       errorContainer.MaterialSnackbar.showSnackbar(data);
                       //stop loading animation
                       place.loadingWikiLinks(false);
                       //remove the animation
                       place.marker.setAnimation(null);
                 });
        };

        //this function is called when the place is clicked in the place list
        self.showInMap = function(place) {
            //show the place for now.
            infowindow.setContent(place.name);
            infowindow.open(map, place.marker);
           //show loading wiki links
            place.loadingWikiLinks(true);

            //animated the marker
            place.marker.setAnimation(google.maps.Animation.BOUNCE);
            //pan to the marker position
            map.panTo(place.marker.getPosition());
            //set a little zoom
            map.setZoom(14);
            //set to center
            map.setCenter(place.marker.getPosition());

            //make a ajax call to show related wiki links on click of marker
            //the set timeout is just used to demonstrate the loading animation based on knockout
            setTimeout(function(){
                   self.showWikiInfo(place);
                }, 1000);

        };

        /**
         *filtering the place list
         *every time the filter search is typed in this function gets called
         *if the text being searched is included in the search list we should see the place list updated.
         *the function also updates the marker observable, this way the markers are filtered out in the map
         */
        self.filteredPlaces = ko.computed(function() {
            var filter = self.filter().toLowerCase();
            if (!filter) {
               self.places().forEach(function(place) {
                    //if filter string is modified and equals nothing we set the marker to show
                    if( place.marker !== undefined)
                        place.marker.setVisible(true);
               });
               return self.places();
            }
            else {
                 return ko.utils.arrayFilter(self.places(), function(place) {
                        if(place.name.toLowerCase().includes(filter)) {
                            // only those markers will show that match the filter string
                            place.marker.setVisible(true);
                            return true;
                        }
                        //rest of the markers we hide.
                        place.marker.setVisible(false);
                        return false;
                 });
            }
        });
    };

    // initialize the places view model
    var placesViewModel = new PlacesViewModel();

    /**map is used to store the map object
     *this will be called when the map async call loads asynchronously
     *see this
     *https://developers.google.com/maps/documentation/javascript/adding-a-google-map
     */
    var map;
    var infowindow;
    function initMap() {
        try {
             map = new google.maps.Map(document.getElementById('map'), {
                    center: {lat: MANHATTAN_NEW_YORK_CITY_LAT, lng: MANHATTAN_NEW_YORK_CITY_LONG},
                    zoom: 13
             });
       }
       catch (err) {
             //you need to make sure if material js is ready
             //http://stackoverflow.com/questions/34579700/material-design-lite-js-not-applied-to-dynamically-loaded-html-file
             if(typeof(componentHandler) !== 'undefined'){
                   componentHandler.upgradeAllRegistered();
             }
             console.log("error when loading map from google api service",err);
             var data = {
                 message: 'error when loading map from google api service. Check if google map api is down!'
             };
             var errorContainer = document.querySelector('#error-snackbar');
             errorContainer.MaterialSnackbar.showSnackbar(data);
       }
       //initialize a global infowindow
       infowindow = new google.maps.InfoWindow();
       try {
            placeService();
       }
       catch (err) { //error handling
            //you need to make sure if material js is ready
            //http://stackoverflow.com/questions/34579700/material-design-lite-js-not-applied-to-dynamically-loaded-html-file
            if(typeof(componentHandler) !== 'undefined'){
                  componentHandler.upgradeAllRegistered();
            }
            console.log("error when loading map from google place api service",err);
            var dataPlaces = {
                message: 'error when loading map from google place api service. Check if google map api is down!'
            };
            var errorContainerPlaces = document.querySelector('#error-snackbar');
            errorContainerPlaces.MaterialSnackbar.showSnackbar(dataPlaces);
       }
    }

    //use to place library to get places.
    //https://developers.google.com/maps/documentation/javascript/places
    var placeService = function() {
        var service = new google.maps.places.PlacesService(map);
        service.nearbySearch({
            location: {lat: MANHATTAN_NEW_YORK_CITY_LAT, lng: MANHATTAN_NEW_YORK_CITY_LONG},
            radius: 5000,
            type: ['museum']
         }, placeServiceCallback);
    };

    //the service callback method called once the places are retrieved from google api
    var placeServiceCallback = function (results, status) {
        if (status === google.maps.places.PlacesServiceStatus.OK) {
          for (var i = 0; i < results.length; i++) {
            //for each result add to the places observable
            placesViewModel.addPlace( new Place(results[i].place_id, results[i].name, results[i].geometry.location) );
          }
        }
        else { //error handling
            //you need to make sure if material js is ready
             //http://stackoverflow.com/questions/34579700/material-design-lite-js-not-applied-to-dynamically-loaded-html-file
             if(typeof(componentHandler) !== 'undefined'){
                   componentHandler.upgradeAllRegistered();
             }
            console.log("error when loading map from google place api service",err);
            var data = {
                 message: 'error when loading map from google place api service. Check if google map api is down!'
            };
            var errorContainer = document.querySelector('#error-snackbar');
            errorContainer.MaterialSnackbar.showSnackbar(data);
        }
    };
    //apply knockout bindings
    ko.applyBindings(placesViewModel);

    //Error handling via onerror handling
    function mapError(){
        if(typeof(componentHandler) !== 'undefined') {
               componentHandler.upgradeAllRegistered();
        }
        var errorContainer = document.querySelector('#error-snackbar');
        errorContainer.MaterialSnackbar.showSnackbar({message: "error loading google api.Check console logs."});
    }