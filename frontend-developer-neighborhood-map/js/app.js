(function () {

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
        this.marker;
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
        self.filter = ko.observable("");

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
            if (self.togglePlacesListBoolean()) {
                self.togglePlacesDisplayText("Show Place List")
            }
            else {
                self.togglePlacesDisplayText("Hide Place List")
            }
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
                 //make a ajax call to show related wiki links on click of marker
                 //the set timeout is just used to demonstrate the loading animation based on knockout
                 setTimeout(function(){
                        self.showWikiInfo(place);
                     }, 1000);
                 ;
             });
        };

        /**
            this function will call the wiki api to get related links.
         */
        self.showWikiInfo = function(place) {
            var wikiUrl = 'https://en.wikipedia.org/w/api.php?action=opensearch&search=' +place.name + '&format=json&callback=wikiCallback';
            $.ajax({
                     url: wikiUrl,
                     dataType: "jsonp",

                     success: function ( response ) {
                         //we empty the wiki links if they were previously loaded
                         place.relatedWikiLinks([]);
                         for (var i = 0 ; i < response[1].length ; i++ ) {
                             place.relatedWikiLinks.push({title:response[1][i],url:response[3][i]});
                         }
                         //build a html to show on the content info panel
                         var infoWindowContent = "<h5>"+place.name+"</h5>"+
                                        "<h6>Related Links</h6>"+
                                        "<ul>";
                         place.relatedWikiLinks().forEach(function(wikiLink) {
                            infoWindowContent += "<li> <a href='"+wikiLink.url+"' target='_blank'>"+wikiLink.title+"</a></li>";
                         });
                         infoWindowContent += "</ul>";

                         infowindow.setContent(infoWindowContent);
                         //disable the animation
                         place.loadingWikiLinks(false);
                         //clear the error timeout
                         clearTimeout(self.wikiRequestTimeout);
                     }
                 })
                 .fail(function() {
                       //console.log("error while making javascript api");
                       //if failed then clear timeout
                       clearTimeout(self.wikiRequestTimeout);
                       var errorContainer = document.querySelector('#error-snackbar');
                       var data = {
                             message: 'Error while making api call to wikipedia.',
                             timeout: 2000
                           };
                       errorContainer.MaterialSnackbar.showSnackbar(data);
                       //stop loading animation
                       place.loadingWikiLinks(false);

                 });

                 //handle if there is a timeout issue.
                 self.wikiRequestTimeout = setTimeout( function() {
                         var errorContainer = document.querySelector('#error-snackbar');
                         var data = {
                              message: 'Request has timeout to wikipedia api.',
                              timeout: 2000
                            };
                         errorContainer.MaterialSnackbar.showSnackbar(data);
                         //stop loading animation
                         place.loadingWikiLinks(false);
                 } , 8000 );
        };



        //this function is called when the place is clicked in the place list
        self.showInMap = function(place) {
            //show the place for now.
            infowindow.setContent(place.name);
            infowindow.open(map, place.marker);
           //show loading wiki links
            place.loadingWikiLinks(true);
            //make a ajax call to show related wiki links on click of marker
            //the set timeout is just used to demonstrate the loading animation based on knockout
            setTimeout(function(){
                   self.showWikiInfo(place);
                }, 1000);

        };

        /* filtering the place list
            every time the filter search is typed in this function gets called
            if the text being searched is included in the search list we should see the place list updated.
            the function also updates the marker observable, this way the markers are filtered out in the map
        */
        self.filteredPlaces = ko.computed(function() {
            var filter = self.filter().toLowerCase();
            if (!filter) {
               self.places().forEach(function(place) {
                    //if filter string is modified and equals nothing we set the marker to show
                    if( place.marker != undefined)
                        place.marker.setMap(map);
               });
               return self.places();
            }
            else {
                 return ko.utils.arrayFilter(self.places(), function(place) {
                        if(place.name.toLowerCase().includes(filter)) {
                            // only those markers will show that match the filter string
                            place.marker.setMap(map);
                            return true;
                        }
                        //rest of the markers we hide.
                        place.marker.setMap(null);
                        return false;
                 });
            }
        });
    };

    // initialize the places view model
    var placesViewModel = new PlacesViewModel();

    //map is used to store the map object
    //see this
    //https://developers.google.com/maps/documentation/javascript/adding-a-google-map
    var map;
    var mapInit = function () {
         map = new google.maps.Map(document.getElementById('map'), {
                center: {lat: MANHATTAN_NEW_YORK_CITY_LAT, lng: MANHATTAN_NEW_YORK_CITY_LONG},
                zoom: 13
       });
       placeService();
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
    };

    //intialize the maps.
    mapInit();
    //initialize a global infowindow
    var infowindow = new google.maps.InfoWindow();

    //apply knockout bindings
    ko.applyBindings(placesViewModel);

}());