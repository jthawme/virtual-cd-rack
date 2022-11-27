const { chunk } = require("lodash");
const { DynamoDB, config } = require("aws-sdk");

config.update({ region: "us-east-1" });

const dynamoDb = new DynamoDB.DocumentClient();

const TABLE = {
  MAIN: "service-main"
};

const isObject = obj => {
  return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
};

/**
 * Assumes the primary key on the table is called 'id'. Gets a single row
 *
 * @param {any} key
 * @param {string} tableName
 * @param {function} transformItem Useful to remove anything/grab specific properties from the object, or parse JSON etc.
 *
 * @returns {Promise<false | object>}
 */
const getDbItem = async (
  key,
  tableName = TABLE.MAIN,
  transformItem = item => item,
  keyName = "id"
) => {
  return dynamoDb
    .get({
      TableName: tableName,
      Key: isObject(key) ? key : { [keyName]: key }
    })
    .promise()
    .then(item => {
      if (item.Item) {
        return transformItem(item.Item);
      }

      return false;
    });
};

const queryDbItem = async (
  query = {},
  tableName = TABLE.MAIN,
  transformItem = item => item
) => {
  return dynamoDb
    .query({
      TableName: tableName,
      ...query
    })
    .promise()
    .then(results => {
      if (results.Items) {
        return results.Items.map(item => transformItem(item));
      }

      return false;
    });
};

/**
 * Save an object to the db.
 *
 * @param {object} item
 * @param {string} tableName
 *
 * @returns {Promise<void>}
 */
const saveDbItem = (item, tableName = TABLE.MAIN) => {
  return dynamoDb
    .put({
      TableName: tableName,
      Item: item
    })
    .promise();
};

/**
 * Assumes the primary key on the table is called 'id'. Gets a single row
 *
 * @param {any} key
 * @param {string} tableName
 *
 * @returns {Promise<false | object>}
 */
const deleteDbItem = async (key, tableName = TABLE.MAIN, keyName = "id") => {
  return dynamoDb
    .delete({
      TableName: tableName,
      Key: isObject(key) ? key : { [keyName]: key }
    })
    .promise();
};

/**
 * This is likely just useful to have as a reference, it gets quite specific
 *
 * @param {string} key
 * @param {object} item
 * @param {string} tableName
 *
 * @returns {Promise<void>}
 */
const alpha = `abcdefghijklmnopqrstuvwxyz`;
const updateDbItem = (key, item, tableName = TABLE.MAIN, keyName = "id") => {
  // properly just trying to show off here, so unecessary
  const UpdateExpression = `set ${Object.keys(item)
    .filter(k => k !== keyName)
    .map((k, idx) => `#${alpha.charAt(idx)} = :${k.toLowerCase()}`)
    .join(", ")}`;

  const ExpressionAttributeNames = Object.entries(item)
    .filter(item => item[0] !== keyName)
    .reduce((cumulativeObject, currProperty, idx) => {
      return {
        ...cumulativeObject,
        [`#${alpha.charAt(idx)}`]: currProperty[0]
      };
    }, {});

  const ExpressionAttributeValues = Object.entries(item)
    .filter(item => item[0] !== keyName)
    .reduce((cumulativeObject, currProperty) => {
      return {
        ...cumulativeObject,
        [`:${currProperty[0].toLowerCase()}`]: currProperty[1]
      };
    }, {});

  return dynamoDb
    .update({
      TableName: tableName,
      Key: isObject(key) ? key : { [keyName]: key },
      UpdateExpression,
      ExpressionAttributeNames,
      ExpressionAttributeValues
    })
    .promise();
};

/**
 * Method to batch save items to a DB
 *
 * @param {array} itemsRaw
 * @param {string} tableName
 *
 * @returns {Promise<void[]>}
 */
const saveMultipleItems = (itemsRaw, tableName = TABLE.MAIN) => {
  const items = itemsRaw.map(item => {
    return {
      Put: {
        TableName: tableName,
        Item: item
      }
    };
  });

  return Promise.all(
    chunk(items, 25).map(chunk => {
      return dynamoDb
        .transactWrite({
          TransactItems: chunk
        })
        .promise();
    })
  );
};

const deleteMultipleItems = (items, TableName = TABLE.MAIN) => {
  const chunked = chunk(items, 25).map(chunkedItems => ({
    RequestItems: {
      [TableName]: chunkedItems.map(item => {
        return {
          DeleteRequest: {
            Key: item
          }
        };
      })
    }
  }));

  return Promise.all(
    chunked.map(params => dynamoDb.batchWrite(params).promise())
  );
};

const scanTable = (TableName = TABLE.MAIN, silent = true) => {
  return new Promise((resolve, reject) => {
    const items = [];

    const get = key => {
      const params = {
        TableName
      };

      if (key) {
        params.ExclusiveStartKey = key;
      }

      dynamoDb
        .scan(params)
        .promise()
        .then(data => {
          items.push(...data.Items);
          if (silent) {
            console.log(`Total records currently: ${items.length}`);
          }

          if (data.LastEvaluatedKey && data.LastEvaluatedKey !== key) {
            get(data.LastEvaluatedKey);
          } else {
            resolve(items);
          }
        })
        .catch(e => reject(e));
    };

    get();
  });
};

module.exports = {
  dynamoDb,
  TABLE,
  getDbItem,
  queryDbItem,
  saveDbItem,
  deleteDbItem,
  updateDbItem,
  saveMultipleItems,
  deleteMultipleItems,
  scanTable
};
