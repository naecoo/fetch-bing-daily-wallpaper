const http = require("http");
const path = require("path");
const fs = require("fs");

const bingURL = "https://www.bing.com";

const request = () => {
  return new Promise((resolve, reject) => {
    const req = http.request(
      {
        method: "GET",
        host: "bing.com",
        path: "/HPImageArchive.aspx?format=json&idx=0&n=1&mkt=zh-CN",
        timeout: 5000,
        headers: {
          Referer: bingURL,
          "User-Agent":
            "Mozilla/4.0 (compatible; MSIE 7.0; Windows NT 10.0; WOW64; Trident/8.0; .NET4.0C; .NET4.0E)",
        },
      },
      (res) => {
        res.setEncoding("utf8");

        if (res.statusCode !== 200) {
          reject("Bad Request");
        }

        let resp = "";
        res.addListener("error", reject);
        res.addListener("data", (chunk) => {
          resp += chunk;
        });
        res.addListener("end", () => {
          resolve(resp);
        });
      }
    );

    req.addListener("error", reject);
    req.end();
  });
};

const main = (content) => {
  const regexps = [
    /<headline>(.+)<\/headline>/g,
    /<url>(.+)<\/url>/g,
    /<copyright>(.+)<\/copyright>/g,
    /<copyrightlink>(.+)<\/copyrightlink>/g,
  ];

  const results = [];
  for (const re of regexps) {
    const parseResult = re.exec(content);

    if (!parseResult) {
      throw new Error("parse content error");
    }

    results.push(parseResult[1]);
  }

  fs.writeFileSync(path.resolve(__dirname, "README.md"), `
## Bing Wallpaper


**${results[0]}**

![bing-wallpaper](${
    bingURL + results[1].slice(0, results[1].indexOf(".jpg") + 4)
  })
[${results[2]}](${results[3]})
  `, 'utf8');
};

let count = 5;
const tick = () => {
  count--;
  console.log("fetch...");
  request()
    .then(main)
    .catch((error) => {
      console.error("error: ", error);
      if (count > 0) {
        console.log("retrying...");
        setTimeout(tick, 1000);
      } else {
        console.log("stop retry");
      }
    });
};

tick();
