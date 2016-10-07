angular.module('app', ['progressButton']);

jQuery('body').on("click", "a[href='#']", function(e) {
	e.preventDefault();
});
