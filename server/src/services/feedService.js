const axios = require("axios");
const xml2js = require("xml2js");

const parser = new xml2js.Parser({
  explicitArray: false,
  strict: false,
  trim: true,
  normalizeTags: true,
  mergeAttrs: true,
});


async function fetchXml(url) {
  const res = await axios.get(url, {
    timeout: 30000,
    headers: {
      "User-Agent": "JobImporterBot/1.0",
    },
  });

  return res.data;
}

function pickFirst(value) {
  if (!value) return null;
  if (Array.isArray(value)) return value[0];
  return value;
}

// RSS feeds usually have: rss.channel.item[]
function normalizeJobs(parsed, sourceUrl) {
  // RSS (handle lowercase + uppercase)
  const rssItems = parsed?.rss?.channel?.item;

  if (rssItems) {
    const list = Array.isArray(rssItems) ? rssItems : [rssItems];

    return list.map((item) => {
      const link = pickFirst(item.link);
      const guid = typeof item.guid === "object" ? item.guid?._ : item.guid;

      const externalId = guid || link || `${sourceUrl}-${item.title}`;

      return {
        sourceUrl,
        externalId: String(externalId),

        title: pickFirst(item.title) || "",
        company: item?.["job:company"] || item?.company || "",
        location: item?.["job:location"] || "",
        jobType: item?.["job:type"] || "",
        category: item?.category || "",

        link: link || "",
        description: pickFirst(item.description) || "",

        publishedAt: item.pubDate ? new Date(item.pubDate) : null,

        raw: item,
      };
    });
  }

  // ATOM
  const atomEntries = parsed?.feed?.entry;
  if (atomEntries) {
    const list = Array.isArray(atomEntries) ? atomEntries : [atomEntries];

    return list.map((entry) => {
      const link =
        typeof entry.link === "object"
          ? entry.link?.href
          : entry.link?.[0]?.href;

      const externalId = entry.id || link || `${sourceUrl}-${entry.title}`;

      return {
        sourceUrl,
        externalId: String(externalId),

        title: typeof entry.title === "object" ? entry.title?._ : entry.title,
        company: entry?.author?.name || "",
        location: "",
        jobType: "",
        category: "",

        link: link || "",
        description:
          typeof entry.summary === "object" ? entry.summary?._ : entry.summary,

        publishedAt: entry.updated ? new Date(entry.updated) : null,

        raw: entry,
      };
    });
  }

  return [];
}

async function fetchJobsFromFeed(sourceUrl) {
  const xml = await fetchXml(sourceUrl);
  if (xml.trim().startsWith("<!DOCTYPE html") || xml.trim().startsWith("<html")) {
    console.log(`⚠️ Skipping feed (HTML response): ${sourceUrl}`);
    return [];
  }

  const cleanedXml = xml
    .replace(/&(?!(amp;|lt;|gt;|quot;|apos;))/g, "&amp;")
    .replace(/<br>/g, "<br/>");

  const parsed = await parser.parseStringPromise(cleanedXml);

  // Most feeds are RSS
  const jobs = normalizeJobs(parsed, sourceUrl);

  return jobs;
}

module.exports = { fetchJobsFromFeed };
