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
    const DIV_SCRIPTURES = "scriptures";
    const REQUEST_GET = "GET";
    const REQUEST_STATUS_OK = 200;
    const REQUEST_STATUS_ERROR = 400;

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
    let bookChapterValid;
    let booksGrid;
    let encodedScriptureUrl;
    let getScriptureFailure;
    let getScriptureSuccess;
    let navigateChapter;
    let navigateBook;
    let navigateHome;
    let onHashChanged;
    let volumesGridContent;
    let volumeTitle;
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

    bookChapterValid = function (bookId, chapter) {
        // NEEDSWORK AND IMPLEMENT THIS
        return true;
    };

    cacheBooks = function(callback) {
        volumes.forEach( function (volume) {
            let volumeBooks = [];
            let bookId = volume.minBookId;

            while (bookId <= volume.maxBookId) {
                volumeBooks.push(books[bookId]);
                bookId += 1;
            }
            volume.books = volumeBooks;
        });

        if (typeof callback === 'function'){
            callback();
        }
    };

    getScriptureFailure = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = "Unable to retrieve chapter contents.";
    };

    getScriptureSuccess = function () {
        document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;
    };

    navigateBook = function(bookId) {
        // NEEDSWORK AND IMPLEMENT THIS
        document.getElementById("scriptures").innerHTML = `Display bookId ${bookId}`;
    };

    navigateChapter = function (bookId, chapter) {
        // NEEDSWORK AND IMPLEMENT THIS
        document.getElementById("scriptures").innerHTML = `Display bookId ${bookId} chapter ${chapter}`;
    };

     navigateHome = function (volumeId) {
        // NEEDSWORK finish THIS
        let html = '';
        volumes.forEach(volume => {
            if (volumeId === undefined || volumeId === volume.id) {
                html += `<h3>${volume.fullName}</h3>`
            }
        });

        document.getElementById("scriptures").innerHTML = html;
    };


    /*----------------------------------------------------------------
    *                   PUBLIC API
    */
    init = function (callback) {
        let booksloaded = false;
        let volumesloaded = false;

        ajax("https://scriptures.byu.edu/mapscrip/model/books.php",
                data => {
                    books = data;
                    booksloaded = true;

                    if (volumesloaded) {
                        cacheBooks(callback);
                    }
                }
        );
        ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php",
                data => {
                    volumes = data;
                    volumesloaded = true;
                    if (booksloaded){
                        cacheBooks(callback);
                    }
                }
        );

    };

      onHashChanged = function (event) {
        let ids = [];

        if (location.hash !== "" && location.hash.length > 1) {
            ids = location.hash.slice(1).split(":");
        }

        if (ids.length <= 0) {
            navigateHome();
        } else if (ids.length === 1) {
            const volumeId = Number(ids[0]);

            if (volumes.map((volume) => volume.id).includes(volumeId)) {
                navigateHome(volumeId);
            } else {
                navigateHome();
            }
        } else {
            const bookId = Number(ids[1]);
            if (books[bookId] === undefined) {
                navigateHome();
            } else {
                if (ids.length == 2) {
                navigateBook(bookId);
                } else {
                    const chapter = Number(ids[2]);
                    if (bookChapterValid(bookId, chapter)) {
                        navigateChapter(bookId, chapter);
                    } else {
                        navigateHome();
                    }
                }
            }

        }
    };

   return {
    init,
    onHashChanged
   };

} ()  );