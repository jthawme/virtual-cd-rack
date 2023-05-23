const { search, fuzzy } = require("fast-fuzzy");

const { saveDbItem, getDbItem, scanTable, TABLE } = require("./common/db");
const {
  searchReleases,
  getRelease,
  prepareAlbum
} = require("./common/musicbrainz");
const { validateSchema } = require("./common/validation");
const { verifyRecaptcha, retrieveUserSourceIp } = require("./utilities");
const { wrap } = require("./wrap");

const ping = wrap((event, context, callback) => {
  return {
    statusCode: 200,
    body: {
      ping: new Date().getTime(),
      name: process.env.SERVICE_NAME
    }
  };
});

const searchBarcode = wrap(async (event, context, callback) => {
  const body = JSON.parse(event.body);

  const { valid, keys } = validateSchema(body, ["token"]);

  if (!valid) {
    return {
      statusCode: 400,
      body: {
        error: true,
        keys
      }
    };
  }

  const { token, barcode, album: albumSearch, artist: artistSearch } = body;

  if (!(await verifyRecaptcha(token, retrieveUserSourceIp(event)))) {
    return {
      statusCode: 400,
      body: {
        error: true,
        keys: [
          {
            key: "recaptcha",
            message: "Recaptcha error"
          }
        ]
      }
    };
  }

  const data = await searchReleases(barcode, albumSearch, artistSearch);

  const filterReleases = arr => {
    if (barcode) {
      return arr;
    }

    if (albumSearch) {
      const filtered = arr.filter(item => {
        if (!artistSearch) {
          return true;
        }

        return item["artist-credit"].some(item => {
          return fuzzy(item.artist.name, artistSearch) > 0.75;
        });
      });

      return search(albumSearch, filtered, {
        keySelector: obj => {
          return obj.title;
        },
        threshold: 0.8
      });
    }

    return arr;
  };

  const releaseArr = filterReleases(data.releases || data["release-groups"]);

  if (!releaseArr || releaseArr.length === 0) {
    return {
      statusCode: 200,
      body: {
        albums: false
      }
    };
  }

  const albums = (
    await Promise.all(
      releaseArr
        .filter((item, index, arr) => {
          return (
            // item.status === "Official" &&
            index === arr.findIndex(subItem => subItem.title === item.title)
          );
        })
        .slice()
        .slice(0, 6)
        .map(album => getRelease(album.id))
    )
  ).map(album => prepareAlbum(album));

  const fullMatch = albums.find(item => item.barcode === barcode);

  return {
    statusCode: 200,
    body: {
      albums: fullMatch ? [fullMatch] : albums
    }
  };
});

const addRelease = wrap(async (event, context, callback) => {
  const body = JSON.parse(event.body);

  const { valid, keys } = validateSchema(body, ["token", "mbid"]);

  if (!valid) {
    return {
      statusCode: 400,
      body: {
        error: true,
        keys
      }
    };
  }

  const { token, mbid, color = false, images = false } = body;

  if (!(await verifyRecaptcha(token, retrieveUserSourceIp(event)))) {
    return {
      statusCode: 400,
      body: {
        error: true,
        keys: [
          {
            key: "recaptcha",
            message: "Recaptcha error"
          }
        ]
      }
    };
  }

  const release = await getRelease(mbid);
  const album = prepareAlbum(release, {
    color,
    images
  });

  await saveDbItem(album);

  return {
    statusCode: 200,
    body: {
      success: true,
      album
    }
  };
});

const loadAlbums = wrap(async (event, context, callback) => {
  const albums = await scanTable(TABLE.MAIN, true);

  albums.sort((a, b) =>
    (a.sortName || a.data.title).localeCompare(b.sortName || b.data.title)
  );

  return {
    statusCode: 200,
    body: {
      albums: albums.map(album => ({
        id: album.data.mbid,
        artists: album.data.artists.map(({ title }) => title),
        title: album.data.title,
        color: album.data.color,
        artwork: album.data.artwork
          ? {
              small:
                album.data.images?.small ||
                Object.values(album.data.artwork.thumbnails).shift(),
              large: album.data.images?.large || album.data.artwork.src
            }
          : null
      }))
    }
  };
});

module.exports = {
  ping,
  searchBarcode,
  addRelease,
  loadAlbums
};
