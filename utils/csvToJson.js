// utils/csvToJson.js
const csv = require('csvtojson');

const convertCsvToJson = async (csvData) => {
  try {
    const jsonArray = await csv().fromString(csvData);
    return jsonArray;
  } catch (error) {
    throw error;
  }
};

module.exports = convertCsvToJson;
