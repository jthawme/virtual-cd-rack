const glpn = require("google-libphonenumber");
const validator = require("email-validator");

const PNF = glpn.PhoneNumberFormat;
const phoneUtil = glpn.PhoneNumberUtil.getInstance();

const validateSchema = (obj, schema) => {
  const failed = schema.filter(item => {
    if (typeof item === "string") {
      return (
        !(item in obj) ||
        (typeof obj[item] === "string" ? obj[item].trim() === "" : !obj[item])
      );
    }

    const { key, validator } = item;

    if (!validator) {
      return !(item in obj) || obj[item].trim() === "";
    }

    return !validator(obj[key]);
  });

  return failed.length === 0
    ? { valid: true }
    : {
        valid: false,
        keys: failed.map(item => {
          const key = typeof item === "string" ? item : item.key;
          const value = typeof item === "string" ? item : obj[item.key];

          return {
            key,
            message:
              typeof item.error !== "undefined" ? item.error(value) : "missing"
          };
        })
      };
};

const minMaxValidation = (
  max,
  min = 0,
  { extraValidator, extraError } = {}
) => ({
  validator: val => {
    return (
      val &&
      val.length >= min &&
      val.length <= max &&
      (extraValidator ? extraValidator(val) : true)
    );
  },
  error: val => {
    if (!val) {
      return "missing";
    }

    if (val.length < min) {
      return "Too short";
    }

    const extra = extraError ? extraError(val) : false;

    if (extra) {
      return extra;
    }

    return "Too long";
  }
});

const TEST_NUMBERS = ["+31 6 26148514", "+447534213949"];

const formatPhoneNumber = _phoneNumber => {
  if (TEST_NUMBERS.includes(_phoneNumber)) {
    return _phoneNumber;
  }

  const phoneNumber = phoneUtil.parseAndKeepRawInput(_phoneNumber, "US");

  if (!phoneUtil.isValidNumber(phoneNumber)) {
    throw new Error("Invalid number");
  }

  return phoneUtil.format(phoneNumber, PNF.E164);
};

const isValidPhoneNumber = _phoneNumber => {
  try {
    const phoneNumber = phoneUtil.parseAndKeepRawInput(_phoneNumber, "US");

    if (!phoneUtil.isValidNumber(phoneNumber)) {
      return false;
    }

    return {
      number: _phoneNumber,
      formatted: phoneUtil.format(phoneNumber, PNF.E164)
    };
  } catch (e) {
    return false;
  }
};

const isValidEmailAddress = email => {
  if (!validator.validate(email)) {
    return false;
  }

  // if (email.match(/\+/)) {
  //   reject(new Error("Cannot use emails with '+'"));
  //   return;
  // }

  return true;
};

// const messageSchema = [
//   "singlekey",
//   {
//     key: "customvalidator",
//     validator: val => isValidEmailAddress(val),
//   },
//   {
//     key: "custommessage",
//     validator: val => isValidPhoneNumber(val),
//     error: val => {
//       // if the value isnt here return missing
//       if (!val) {
//         return "missing";
//       }
//       // if it is, it must be invalid
//       return "Invalid number";
//     }
//   },
//   {
//     key: "minmaxcheck",
//     ...minMaxValidation(300, 50)
//   },
// ];

module.exports = {
  validateSchema,
  minMaxValidation,
  isValidPhoneNumber,
  isValidEmailAddress,
  formatPhoneNumber
};
