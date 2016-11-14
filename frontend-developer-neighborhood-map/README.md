# Neighborhood Map for Museums in Manhattan, New York

is a Single page application featuring a map of the museums in New York City.

## Functionality

* To see the functionality click link [here] (https://melvinmonteiro.github.io/frontend-developer-neighborhood-map/)
* You may see a loading icon before the knockout bindings are loaded
* Once the application is loaded you should see a google map and a sidebar with list of musuems
* The sidebar on the left has a fixed search filter and a 'Hide/Show Place List' button.
* You will see a predefined list of museums that you can scroll through
* You should see markers on the map.
* Clicking on the museum marker in the list or the map should load a list of related links both on the marker in the maps and the list.
* You should see a animation loading on the list view while the async ajax call is being made.
* You should see the marker animate when clicked or the musuem in the list is clicked.
* Clicking on the marker should show a info window with the place name and related links from wikipedia.
* Typing inside the Filter List should only show you the musuems that have the text included. Also markers will be filtered out.
* Clicking on the 'Hide Place List' button will hide the list view. This is for mobile users, so that they can see the map.

## Ajax Error Handling

* If the api request to wiki fails, a small [snackbar](https://getmdl.io/components/#snackbar-section) will show up.
* If the api times out, a small [snackbar](https://getmdl.io/components/#snackbar-section) will show up.

## Resources
* [Knockout JS Framework] (http://knockoutjs.com/)
* [Wikipedia API](https://www.mediawiki.org/wiki/API:Main_page)
* [Google Maps JavaScript API](https://developers.google.com/maps/documentation/javascript/adding-a-google-map)
* [Google Maps Places API](https://developers.google.com/maps/documentation/javascript/places)
* [Google Material Design](https://getmdl.io/)
* [Ajax] (http://api.jquery.com/jquery.ajax/)
