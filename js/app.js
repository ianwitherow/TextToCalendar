angular.module('app', []);

jQuery('body').on("click", "a[href='#']", function(e) {
	e.preventDefault();
});
