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
  const URL_BASE = "https://scriptures.byu.edu/mapscrip/";
  const URL_BOOKS = `${URL_BASE}model/books.php`;
  const URL_SCRIPTURES = `${URL_BASE}mapgetscrip.php`;
  const URL_VOLUMES = `${URL_BASE}model/volumes.php`;

  /*----------------------------------------------------------------
   *                   PRIVATE VARIABLES
   */
  let books;
  let mapPins = [];
  let volumes;
  /*----------------------------------------------------------------
   *                   PRIVATE METHOD DECLARATIONS
   */
  let init;
  let cacheBooks;
  let ajax;
  let bookChapterValid;
  let booksGrid;
  let chaptersGrid;
  let clearMapPins;
  let encodedScriptureUrl;
  let getScriptureFailure;
  let getScriptureSuccess;
  let navigateChapter;
  let navigateBook;
  let navigateHome;
  let navigationBreadcrumbs;
  let onHashChanged;
  let resetMapPins;
  let volumesGridContent;
  let volumeTitle;
  let extractGeoplaces;
  /*----------------------------------------------------------------
   *                   PRIVATE METHODS
   */
  ajax = function (url, successCallback, failureCallback, skipJsonParse) {
    let request = new XMLHttpRequest();
    request.open("GET", url, true);

    request.onload = function () {
      if (request.status >= 200 && request.status < 400) {
        //Success!
        let data = skipJsonParse
          ? request.response
          : JSON.parse(request.response);

        if (typeof successCallback === "function") {
          successCallback(data);
        }
      } else {
        if (typeof failureCallback === "function") {
          failureCallback(request);
        }
      }
    };
    request.onerror = failureCallback;
    request.send();
  };

  bookChapterValid = function (bookId, chapter) {
    const book = books[bookId];

    if (book === undefined) {
      return false;
    }

    if (chapter === Number.isInteger(book)) {
      //return false;
    }

    if (chapter === book.numChapters) {
      return true;
    }

    if (chapter >= 1 && chapter <= book.numChapters) {
      return true;
    }

    return false;
  };

  booksGrid = function (volume) {
    let gridContent = `<div class="books">`;
    volume.books.forEach(function (book) {
      gridContent += `<a class="btn" id=${book.id} href="#${volume.id}:${book.id}">${book.gridName}</a>`;
    });
    return `${gridContent}</div>`;
  };

  cacheBooks = function (callback) {
    volumes.forEach(function (volume) {
      let volumeBooks = [];
      let bookId = volume.minBookId;

      while (bookId <= volume.maxBookId) {
        volumeBooks.push(books[bookId]);
        bookId += 1;
      }
      volume.books = volumeBooks;
    });

    if (typeof callback === "function") {
      callback();
    }
  };

  chaptersGrid = function (bookId) {
    let chapterGrid = "";
    const book = books[bookId];
    // Generate grid of chapters
    for (let i = 1; i <= book.numChapters; i++) {
      chapterGrid += `<a class="chapter btn" id="${i}" href="#${book.parentBookId}:${bookId}:${i}">Chapter ${i}</a></br>`;
    }
    navigationBreadcrumbs(book.parentBookId, bookId);
    return chapterGrid;
  };

  clearMapPins = function () {
    //fix this from video
    for (const pin of mapPins) {
      pin.setMap(null);
    }
    mapPins = [];
  };

  encodedScriptureUrl = function (bookId, chapter, verses, isJst) {
    if (bookId !== undefined && chapter !== undefined) {
      let options = "";

      if (verses !== undefined) {
        options += verses;
      }

      if (isJst !== undefined) {
        options += "&jst=JST";
      }
      return `${URL_SCRIPTURES}?book=${bookId}&chap=${chapter}&verses${options}`;
    }
  };

  extractGeoplaces = function () {
    const uniqueGeoplaces = {};
    const placelinks = document.querySelectorAll("a[onclick^='showLocation']");

    placelinks.forEach(function (placelink) {
      const parsedItems = placelink.getAttribute("onclick").split(",");
      const key = `${parsedItems[2]}|${parsedItems[3]}`;
      const value = {
        placename: parsedItems[1].replace(/'/g, ""),
        latitude: Number(parsedItems[2]),
        longitude: Number(parsedItems[3]),
        viewAltitude: Number(parsedItems[8]),
      };
      if (uniqueGeoplaces[key] !== undefined) {
        //we have an existing geoplace
        // need to go back to video on the 5th to see what he said about this
        // finish this by appending the placename if needed onto an existing object
      } else {
        uniqueGeoplaces[key] = value;
      }
    });

    return uniqueGeoplaces;
  };

  getScriptureFailure = function () {
    document.getElementById(DIV_SCRIPTURES).innerHTML =
      "Unable to retrieve chapter contents.";
  };

  getScriptureSuccess = function (chapterHtml) {
    document.getElementById(DIV_SCRIPTURES).innerHTML = chapterHtml;
    // Extract the geoplaces method
    resetMapPins(extractGeoplaces());
  };

  navigateBook = function (bookId) {
    const book = books[bookId];
    let gridContent = `<div id="scripnav"><div id="volumes"><h2>${
      book.fullName
    }</h2></div><div id="books">${chaptersGrid(bookId)}</div></div>`;
    document.getElementById("scriptures").innerHTML = gridContent;
  };

  navigateChapter = function (bookId, chapter) {
    ajax(
      encodedScriptureUrl(bookId, chapter),
      getScriptureSuccess,
      getScriptureFailure,
      true
    );
  };

  navigateHome = function (volumeId) {
    document.getElementById(
      "scriptures"
    ).innerHTML = `<div id="scripnav">${volumesGridContent(volumeId)}</div>`;
    navigationBreadcrumbs(volumeId);
  };

  //updateMarkers

  navigationBreadcrumbs = function (volumeId, bookId, chapter) {
    if (volumeId === undefined) {
      document.getElementById("crumbs").innerHTML =
        "<div><span>The Scriptures<span></div>"; //(the last item in the list is not clickable)
    } else {
      if (chapter === undefined) {
        let book = books[bookId];
        document.getElementById(
          "crumbs"
        ).innerHTML = `<div><span><a href="#">The Scriptures</a></span><span>  <i class="arrow right"></i> ${book.fullName}</span></div>`;
      } else {
        let book = books[bookId];
        document.getElementById(
          "crumbs"
        ).innerHTML = `<div><span><a href="#">The Scriptures</a></span><span>  <i class="arrow right"></i><a href="#${book.parentBookId}:${book.id}"> ${book.fullName}</a></span><span>  <i class="arrow right"></i> Chapter ${chapter}</span></div>`;
      }
    }
  };

  volumesGridContent = function (volumeId) {
    let gridContent = "";

    volumes.forEach((volume) => {
      if (volumeId === undefined || volumeId === volume.id) {
        gridContent += `<div class="volume">${volumeTitle(volume)}</div>`;
        gridContent += booksGrid(volume);
      }
    });
    return gridContent;
  };

  volumeTitle = function (volume) {
    return `<a href="#${volume.id}"><h5>${volume.fullName}</h5></a>`;
  };

  resetMapPins = function (geoplaces) {
    if (!mapIsLoaded) {
      console.log("calling resetMapPins a bit early");
      //call this function again in half a second
      window.setTimeout(function () {
        resetMapPins(geoplaces);
      }, 500);
      return;
    }

    clearMapPins();

    const bounds = new google.maps.LatLngBounds(); // Create a LatLngBounds object to encompass all markers

    Object.values(geoplaces).forEach(function (geoplace) {
      const position = new google.maps.LatLng(
        geoplace.latitude,
        geoplace.longitude
      );
      const pin = new markerWithLabel.MarkerWithLabel({
        position: position,
        clickable: false,
        draggable: false,
        labelAnchor: new google.maps.Point(-21, 3),
        map,
        labelContent: geoplace.placename,
        labelClass: "maplabel",
      });

      mapPins.push(pin);
      bounds.extend(position); // Extend the bounds to include this marker's position
    });

    // Check the number of markers
    if (mapPins.length > 1) {
      // Fit the map to the bounds if there are more than one marker
      map.fitBounds(bounds);
    } else if (mapPins.length === 1) {
      // If there's only one marker, set the map center to that marker's position
      map.setCenter(mapPins[0].getPosition());
      map.setZoom(10); // Adjust the zoom level as desired
    }
  };

  /*----------------------------------------------------------------
   *                   PUBLIC API
   */
  init = function (callback) {
    let booksloaded = false;
    let volumesloaded = false;

    ajax("https://scriptures.byu.edu/mapscrip/model/books.php", (data) => {
      books = data;
      booksloaded = true;

      if (volumesloaded) {
        cacheBooks(callback);
      }
    });
    ajax("https://scriptures.byu.edu/mapscrip/model/volumes.php", (data) => {
      volumes = data;
      volumesloaded = true;
      if (booksloaded) {
        cacheBooks(callback);
      }
    });
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
        //navigationBreadcrumbs(volumeId);
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
          //navigationBreadcrumbs(books.parentBookId, bookId);
        } else {
          const volumeId = Number(ids[0]);
          const chapter = Number(ids[2]);
          if (bookChapterValid(bookId, chapter)) {
            navigateChapter(bookId, chapter);
            navigationBreadcrumbs(volumeId, bookId, chapter);
          } else {
            navigateHome();
          }
        }
      }
    }
  };

  return {
    init,
    onHashChanged,
  };
})();
