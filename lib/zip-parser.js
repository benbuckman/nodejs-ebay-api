

exports.parseResponseZip = function(response) {

  var startIndex = response.lastIndexOf("Content-ID: <urn:uuid:");
  var endIndex = response.lastIndexOf("--MIMEBoundaryurn_uuid_");
  if (startIndex == -1 || endIndex == -1) return null;

  // skip \r\n before the last boundary
  endIndex -= 2;

  // 32 is the the uuid's length
  // 4 is the length of two \r\n
  startIndex += "Content-ID: <urn:uuid:".length + 32 + 4;

  return response.substring(startIndex, endIndex);
}
