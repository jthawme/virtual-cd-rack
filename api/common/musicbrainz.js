const MusicBrainzApi = require("musicbrainz-api").MusicBrainzApi;
const CA = require("coverart");
const Vibrant = require("node-vibrant");
const axios = require("axios");

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

const searchReleases = async (barcode, albumName) => {
  if (barcode) {
    return mbApi.searchRelease({
      query: {
        barcode
      }
    });
  }

  return mbApi.searchRelease({ query: albumName });
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

const getColor = async artwork => {
  if (!artwork || !artwork.image) {
    return false;
  }

  const arrBuffer = await axios({
    method: "get",
    url: artwork.image,
    responseType: "arraybuffer"
  }).then(function({ data: imageBuffer }) {
    return imageBuffer;
  });

  const palette = await Vibrant.from(arrBuffer).getPalette();

  return {
    vibrant: palette.Vibrant.hex,
    dark: palette.DarkVibrant.hex,
    light: palette.LightVibrant.hex,
    muted: palette.Muted.hex,
    darkMuted: palette.DarkMuted.hex,
    lightMuted: palette.LightMuted.hex
  };
};

const getRelease = async mbid => {
  const album = await mbApi.lookupRelease(mbid, ["artists"]);
  const coverArt = await getReleaseArtwork(mbid);
  const color = await getColor(extractImage(coverArt));

  return {
    ...album,
    artwork: coverArt,
    color
  };
};

const getSortVersion = artistName => {
  const lower = artistName.toLowerCase();

  if (lower.startsWith("the ")) {
    return lower.substring(4);
  }

  return lower;
};

const prepareAlbum = album => {
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
      color: album.color,
      artwork: artwork
        ? {
            id: artwork.id,
            src: artwork.image,
            thumbnails: artwork.thumbnails
          }
        : false
    }
  };
};

module.exports = {
  searchReleases,
  getRelease,
  prepareAlbum
};
