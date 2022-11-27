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

const searchReleases = async barcode => {
  return mbApi.searchRelease({
    query: {
      barcode
    }
  });
};

const getReleaseArtwork = mbid => {
  return new Promise((resolve, reject) => {
    ca.release(mbid, (err, response) => {
      if (err) {
        reject(err);
        return;
      }

      resolve(response);
    });
  });
};

const getRelease = async mbid => {
  const album = await mbApi.lookupRelease(mbid, ["artists"]);
  const coverArt = await getReleaseArtwork(mbid);

  return {
    ...album,
    artwork: coverArt
  };
};

const prepareAlbum = album => {
  const artwork =
    album.artwork.images.find(item => item.front) || album.artwork[0];

  return {
    barcode: album.barcode,
    title: [album.title, ...album["artist-credit"].map(item => item.name)].join(
      "-"
    ),
    added: Date.now(),
    date: album.date,
    data: {
      title: album.title,
      artists: album["artist-credit"].map(item => ({
        title: item.artist.name,
        id: item.artist.id
      })),
      mbid: album.id,
      artwork: {
        id: artwork.id,
        src: artwork.image,
        thumbnails: artwork.thumbnails
      }
    }
  };
};

module.exports = {
  searchReleases,
  getRelease,
  prepareAlbum
};
