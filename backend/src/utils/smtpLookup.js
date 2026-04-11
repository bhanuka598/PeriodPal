const dns = require("dns");

/**
 * DNS lookup that forces IPv4. Many hosts (e.g. Render) have no working IPv6 route to
 * smtp.gmail.com, which otherwise resolves to AAAA and fails with ENETUNREACH.
 * Matches dns.lookup(hostname[, options], callback) for Nodemailer.
 */
function smtpLookupIPv4(hostname, options, callback) {
  if (typeof options === "function") {
    callback = options;
    options = {};
  }
  return dns.lookup(hostname, { ...(options || {}), family: 4 }, callback);
}

module.exports = { smtpLookupIPv4 };
