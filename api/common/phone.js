const Vonage = require("@vonage/server-sdk");

const vonage = new Vonage({
  apiKey: process.env.VONAGE_API_KEY,
  apiSecret: process.env.VONAGE_API_SECRET,
  signatureSecret: process.env.VONAGE_SIGNATURE_SECRET,
  signatureMethod: process.env.VONAGE_SIGNATURE_METHOD
});

let isDebug = process.env.LOCAL;

// const isProd = process.env.NODE_ENV !== "development";
const from = process.env.VONAGE_NUMBER;

const sendMessage = (to, message) => {
  if (isDebug) {
    console.group("SEND MESSAGE");
    console.log("TO: ", to);
    console.log("MSG: ", message);
    console.groupEnd();
    return Promise.resolve();
  }

  return new Promise((resolve, reject) => {
    vonage.message.sendSms(from, to, message, (err, responseData) => {
      if (err) {
        reject(err);
      } else {
        if (responseData.messages[0]["status"] === "0") {
          resolve(responseData);
        } else {
          reject(responseData.messages[0]["error-text"]);
        }
      }
    });
  });
};

const Reply = {
  Test: someVar => `Hey there, heres a ${someVar}`
};

module.exports = { sendMessage, Reply };
