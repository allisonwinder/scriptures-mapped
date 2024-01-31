/********************************************************************
 * FILE:    scriptures.js
 * AUTHOR:  Allison Winder
 * DATE:    Winter 2024
 *
 * DESCRIPTION: front-end JavaScript code for The Scriptures, Mapped.
 *              IS 542, Winter 2024, BYU.
 */

const Scriptures = (function () {
    "use strict";
    /*----------------------------------------------------------------
    *                   CONSTANTS
    */

    /*----------------------------------------------------------------
    *                   PRIVATE VARIABLES
    */
    let books;
    let volumes;
    /*----------------------------------------------------------------
    *                   PRIVATE METHOD DECLARATIONS
    */
    let init;
    let cacheBooks;
    let ajax;
    /*----------------------------------------------------------------
    *                   PRIVATE METHODS
    */
    ajax = function (url, successCallback, failureCallback) {
        let request = new XMLHttpRequest();
        request.open('GET', url, true);

        request.onload = function () {
            if (request.status >= 200 && request.status < 400) {
                //Success!
                let data = JSON.parse(request.responseText);

                if (typeof successCallback === "function") {
                    successCallback(data);
                }
            } else {
                if (typeof failureCallback === "function"){
                    failureCallback(request);
                }
            }
        };
        request.onerror = failureCallback;
        request.send();
    };
    cacheBooks = function(callback){
        volumes.forEach (volume => {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            };
            volume.books = volumeBooks;
        });

        if (typeof callback === 'function'){
            callback();
        }
    };
    init = function (callback) {
        let booksloaded = false;
        let volumesloaded = false;

        ajax("https://scriptures.byu.edu/mapscrip/model/books.php",
                data => {
                    //console.log("Load books from server");
                    //console.log(data);
                    books = data;
                    booksloaded = true;

                    if (volumesloaded) {
                        cacheBooks(callback);
                    }
                }
        );
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php",
                data => {
                    //console.log("Load volumes from server");
                    //console.log(data);
                    volumes = data;
                    volumesloaded = true;
                    if (booksloaded){
                        cacheBooks(callback);
                    }
                }
        );

    };
    /*----------------------------------------------------------------
    *                   PUBLIC API
    */
   return {
    init: init
   };
}());