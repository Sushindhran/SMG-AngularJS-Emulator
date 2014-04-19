/*Downloaded from https://github.com/bklik/popup
 */
angular.module('popup.directives', [])

    .directive('popup', ['$compile', '$timeout', function($compile, $timeout) {
        return {
            restrict: 'A',
            scope: {},
            link: function(scope, element, attrs) {
                var strPopup = null;    // String version of the popup's HTML
                var cPopup = null;      // Compiled version of the popup
                var popup = null;     // Pointer to the current element's popup
                var bodyWidth = 0;

                // Wait until the directive is loaded before initializing variables
                $timeout(function() {
                    var directive = element.attr("directive");
                    strPopup = '<div class="popup"><' + directive + '></' + directive + '></div>';
                    cPopup = $compile(strPopup)(scope);
                });

                // Called to prevent popup from closing while actions are being performed
                // inside the popup.
                var preventClose = function(event) {
                    event.stopPropagation();
                }

                // Used to position the popup under the focused element
                var placePopup = function() {
                    var offset = $(element).offset();
                    var top = offset.top + $(element).outerHeight() + 16;
                    var left = offset.left;

                    var popupWidth = left + popup.outerWidth();

                    // If the popup would extend off the current window size,
                    // justify the popup to the right instead of left.
                    if(popupWidth > bodyWidth) {
                        left = (offset.left + $(element).outerWidth()) - popup.outerWidth();
                        popup.addClass("arrow-right");
                    } else {
                        popup.removeClass("arrow-right");
                    }

                    popup.css('top', top);
                    popup.css('left', left);
                };

                // Used to open the popup
                var openPopup = function(event) {
                    // Make sure any currently open popups are closed
                    closePopup();

                    bodyWidth = $("body").outerWidth();

                    // Add the popup to the DOM and set it's pointer
                    $("body").append(cPopup);
                    popup = $(cPopup);

                    // Check for mobile device. If mobile, blur the input to prevent
                    // the keyboard from opening.
                    if(isMobile()) {
                        $(element).addClass("popup-highlight");
                        $(element).blur();
                    }

                    // Add events to handle the appropriate closing of the popup
                    $(window).bind("mousedown", closePopup);
                    $(window).bind("resize", resizeHandler);
                    popup.bind("mousedown", preventClose);

                    // Place the popup appropriately
                    placePopup();

                    // Let the popup's content know the element's value
                    scope.$broadcast("POPUP_VALUE", element.val());
                };

                // Used to close the popup and clean up events
                var closePopup = function(event) {
                    if(popup != null) {
                        $(window).unbind("mousedown", closePopup);
                        $(window).unbind("resize", resizeHandler);
                        popup.unbind("mousedown", preventClose);
                        popup.removeClass("arrow-right");
                        $(element).removeClass("popup-highlight");

                        popup.remove();
                        popup = null;
                    }
                };

                // Handler for whenever the window size changes while the popup
                // is open.
                var resizeHandler = function(event) {
                    bodyWidth = $("body").outerWidth();
                    placePopup();
                };

                // Mobile check function from http://detectmobilebrowsers.com/
                var isMobile = function() {
                    if( /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) )
                        return true;
                    return false;
                };

                // Events to appropriately handle the opening and closing of the popup
                $(element).bind("focus", openPopup);
                $(element).bind("keydown", function(event){
                    if(event.keyCode == 9)
                        closePopup();
                });

                // Listen for a request to close the popup, and do so
                scope.$on("CLOSE_POPUP", function(event, message) {
                    closePopup(event);
                });

                // Listen for a request to update the element's value, and do so
                scope.$on("UPDATE_POPUP", function(event, message) {
                    element.val(message);
                });
            }
        }
    }]);

angular.module('editState.directives', [])

    .directive('edit',[function(){
        return{
            restrict: 'A',
            link: function(scope, element, attrs) {
                $(element).attr("directive", "edit-state");
                //$(element).addClass("password-input");
            }
        }
    }])
    .directive('editState', [function() {
        return {
            restrict: 'E',
            templateUrl: 'edit-state.html',
            replace: false,
            scope: {},
            link: function(scope, element) {
                scope.closeEditState = function($event) {
                    scope.$emit("CLOSE_POPUP");
                }
            }
        }
    }]);

angular.module('loadState.directives', [])

    .directive('load',[function(){
        return{
            restrict: 'A',
            link: function(scope, element, attrs) {
                $(element).attr("directive", "load-state");
                //$(element).addClass("password-input");
            }
        }
    }])
    .directive('loadState', [function() {
        return {
            restrict: 'E',
            templateUrl: 'load-state.html',
            replace: true,
            scope: {},
            link: function(scope, element) {
                scope.closeLoadState = function($event) {
                    scope.$emit("CLOSE_POPUP");
                }
            }
        }
    }]);

angular.module('saveState.directives', [])
    .directive('save',[function(){
        return{
            restrict: 'A',
            link: function(scope, element, attrs) {
                $(element).attr("directive", "save-state");
                //$(element).addClass("password-input");
            }
        }
    }])
    .directive('saveState', [function() {
        return {
            restrict: 'E',
            templateUrl: 'save-state.html',
            replace: true,
            scope: {},
            link: function(scope, element) {
                scope.closeSaveState = function($event) {
                    scope.$emit("CLOSE_POPUP");
                }
            }
        }
    }]);