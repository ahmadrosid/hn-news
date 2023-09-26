const https = require("https");
const fs = require("fs");

function fetchData(date) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: "hckrnews.com",
      path: `/data/${date}.js`,
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    };

    const req = https.request(options, (res) => {
      let data = "";

      res.on("data", (chunk) => {
        data += chunk;
      });

      res.on("end", () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const parsedData = JSON.parse(data);
            resolve(parsedData);
          } catch (e) {
            reject(new Error("Failed to parse JSON"));
          }
        } else {
          reject(
            new Error(`Server responded with status code ${res.statusCode}`)
          );
        }
      });
    });

    req.on("error", (error) => {
      reject(error);
    });

    req.end();
  });
}

function convertToCSV(jsonData, includeHeaders = true) {
  const headers = Object.keys(jsonData[0]).join(",");
  const rows = jsonData.map((row) => {
    return Object.values(row)
      .map((value) => {
        if (typeof value === "string") {
          return `"${value}"`;
        }
        return value;
      })
      .join(",");
  });

  return includeHeaders ? [headers, ...rows].join("\n") : rows.join("\n");
}

function generateDateRange() {
  const startDate = new Date(2023, 8, 24); // Month is 0-based, so 8 is September
  const endDate = new Date(2021, 0, 1); // 0 is January

  let currentDate = startDate;
  const dates = [];

  while (currentDate >= endDate) {
    const year = currentDate.getFullYear();
    const month = (currentDate.getMonth() + 1).toString().padStart(2, "0");
    const day = currentDate.getDate().toString().padStart(2, "0");

    dates.push(`${year}${month}${day}`);

    // Decrement the date by 1 day
    currentDate.setDate(currentDate.getDate() - 1);
  }

  return dates;
}

(async function () {
  let dates = generateDateRange();
  const filename = "data.csv";
  let includeHeaders = !fs.existsSync(filename);

  for (let i = 0; i < dates.length; i++) {
    try {
      const data = await fetchData(dates[i].toString());
      const csvData = convertToCSV(data, includeHeaders);

      if (includeHeaders) {
        fs.writeFileSync(filename, csvData + "\n", "utf8");
        includeHeaders = false;
      } else {
        fs.appendFileSync(filename, csvData + "\n", "utf8");
      }

      console.log(`Data for ${dates[i]} appended to ${filename}`);
    } catch (error) {
      console.error(`Error for date ${dates[i]}:`, error.message);
    }
  }
})();
