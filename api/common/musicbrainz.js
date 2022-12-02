const MusicBrainzApi = require("musicbrainz-api").MusicBrainzApi;
const CA = require("coverart");

const config = {
  appName: "jt-virtual-cd-rack",
  appVersion: "0.0.1",
  appContactInfo: "hi+mb@jthaw.me"
};

const configString = `${config.appName}/${config.appVersion} ( ${config.appContactInfo} )`;

const mbApi = new MusicBrainzApi({
  appName: "jt-virtual-cd-rack",
  appVersion: "0.0.1",
  appContactInfo: "hi+mb@jthaw.me"
});

const ca = new CA({ userAgent: configString });

const searchReleases = async (barcode, albumName, artistSearch) => {
  if (barcode) {
    return mbApi.searchRelease({
      query: {
        barcode
      }
    });
  }

  if (albumName) {
    return mbApi.searchRelease({ query: albumName, inc: ["artists"] });
  }

  const { artists } = await mbApi.searchArtist({ query: artistSearch });

  return mbApi.lookupArtist(artists[0].id, [
    "releases",
    "release-groups",
    "media"
  ]);
};

const getReleaseArtwork = mbid => {
  return new Promise((resolve, reject) => {
    ca.release(mbid, (err, response) => {
      if (err) {
        resolve(false);
        return;
      }

      resolve(response);
    });
  });
};

const extractImage = artwork => {
  return artwork
    ? artwork.images.find(item => item.front) || artwork[0]
    : false;
};

const getRelease = async mbid => {
  const album = await mbApi.lookupRelease(mbid, ["artists"]);
  const coverArt = await getReleaseArtwork(mbid);

  return {
    ...album,
    artwork: coverArt
  };
};

const getSortVersion = artistName => {
  const lower = artistName.toLowerCase();

  if (lower.startsWith("the ")) {
    return lower.substring(4);
  }

  return lower;
};

const prepareAlbum = (album, additionalData = {}) => {
  const artwork = extractImage(album.artwork);

  return {
    barcode: album.barcode || `nobarcode-${album.id}`,
    title: [album.title, ...album["artist-credit"].map(item => item.name)].join(
      "-"
    ),
    sortName: getSortVersion(album["artist-credit"][0].name),
    added: Date.now(),
    date: album.date,
    data: {
      title: album.title,
      artists: album["artist-credit"].map(item => ({
        title: item.artist.name,
        id: item.artist.id
      })),
      mbid: album.id,
      artwork: artwork
        ? {
            id: artwork.id,
            src: artwork.image,
            thumbnails: artwork.thumbnails
          }
        : false,
      ...additionalData
    }
  };
};

module.exports = {
  searchReleases,
  getRelease,
  prepareAlbum
};
