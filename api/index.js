// const {} = require("./common");

const { saveDbItem } = require("./common/db");
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

  const { valid, keys } = validateSchema(body, ["token", "barcode"]);

  if (!valid) {
    return {
      statusCode: 400,
      body: {
        error: true,
        keys
      }
    };
  }

  const { token, barcode } = body;

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

  const { count, releases } = await searchReleases(barcode);

  if (!count || count === 0) {
    return {
      statusCode: 200,
      body: {
        album: false
      }
    };
  }

  const album = prepareAlbum(
    await getRelease(releases.find(item => item.status === "Official")?.id)
  );

  return {
    statusCode: 200,
    body: {
      album
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

  const { token, mbid } = body;

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

  const album = prepareAlbum(await getRelease(mbid));

  await saveDbItem(album);

  return {
    statusCode: 200,
    body: {
      success: true,
      album
    }
  };
});

module.exports = {
  ping,
  searchBarcode,
  addRelease
};
