const gis = require("g-i-s");

exports.getGIS = (nftName) =>
  new Promise((resolve, reject) => {
    try {
      gis(nftName, (error, results) => {
        if (error) {
          return resolve("");
        } else {
          return resolve(
            results.filter(
              (i) => i.url.endsWith("jpeg") || i.url.endsWith("png")
            )[0].url
          );
        }
      });
    } catch {
      resolve("");
    }
  });
