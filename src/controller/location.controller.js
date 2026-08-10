import axios from "axios";

export const detectLocation = async (req, res) => {
  try {
    // 1. Check if Cloudflare provides the country code directly
    const cfCountry = req.headers["cf-ipcountry"];
    if (cfCountry && cfCountry !== "XX" && cfCountry !== "T1") {
      const countryCode = cfCountry.toUpperCase();
      return res.status(200).json({
        country: countryCode === "NP" ? "Nepal" : countryCode === "IN" ? "India" : countryCode,
        code: countryCode,
        ip: req.headers["cf-connecting-ip"] || req.headers["x-real-ip"] || "",
      });
    }

    // 2. Extract the client's real public IP
    let ip =
      req.headers["cf-connecting-ip"] ||
      req.headers["x-real-ip"] ||
      req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
      req.ip ||
      req.socket.remoteAddress;

    if (ip && ip.startsWith("::ffff:")) {
      ip = ip.replace("::ffff:", "");
    }

    const isPrivateOrLocal = (addr) => {
      if (!addr || addr === "::1" || addr === "127.0.0.1" || addr === "localhost") return true;
      if (addr.startsWith("10.") || addr.startsWith("192.168.")) return true;
      if (/^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(addr)) return true;
      if (addr.startsWith("fe80:") || addr.startsWith("fc00:")) return true;
      return false;
    };

    console.log("Client IP detected:", ip);

    // If local or private IP, query ipwho.is without an IP to get current network
    const url = isPrivateOrLocal(ip)
      ? "https://ipwho.is/"
      : `https://ipwho.is/${ip}`;

    const { data } = await axios.get(url, {
      timeout: 5000,
    });

    if (data && data.success !== false) {
      return res.status(200).json({
        country: data.country || "Nepal",
        code: data.country_code || "NP",
        ip: data.ip || ip,
      });
    }

    res.status(200).json({
      country: "Nepal",
      code: "NP",
      ip: ip || "",
    });
  } catch (error) {
    console.error("Location detection error:", error.response?.data || error.message);
    res.status(200).json({
      country: "Nepal",
      code: "NP",
      ip: "",
    });
  }
};